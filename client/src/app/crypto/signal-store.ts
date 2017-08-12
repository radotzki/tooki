import { jsonThing, stringToArrayBuffer } from './string-utils';

const SIGNAL_STORE = 'SIGNAL_STORE';

export class SignalStore {
    store;
    refreshPreKeys: () => Promise<any>;

    constructor(refreshPreKeys: () => Promise<any>) {
        this.store = this._getFromStorage();
        this.refreshPreKeys = refreshPreKeys;
    }

    setStore(newStore: SignalStore) {
        this.store = newStore;
        this._saveToStorage();
    }

    removeStore() {
        this.store = undefined;
        this._removeFromStorage();
    }

    getIdentityKeyPair() {
        return Promise.resolve(this.get('identityKey'));
    }

    storeIdentityKeyPair(keyPair) {
        return Promise.resolve(this.put('identityKey', keyPair));
    }

    getLocalRegistrationId() {
        return Promise.resolve(this.get('registrationId'));
    }

    storeLocalRegistrationId(registrationId) {
        return Promise.resolve(this.put('registrationId', registrationId));
    }

    put(key, value) {
        if (key === undefined || value === undefined || key === null || value === null) {
            throw new Error('Tried to store undefined/null');
        }

        if (key.startsWith('25519KeypreKey') ||
            key.startsWith('25519KeysignedKey') ||
            key.startsWith('identityKey')) {
            this.store[key] = jsonThing(value);
        } else {
            this.store[key] = JSON.stringify(value);
        }

        this._saveToStorage();
    }

    get(key, defaultValue?) {
        if (key === null || key === undefined) {
            throw new Error('Tried to get value for undefined/null key');
        }
        if (key in this.store) {
            if (key.startsWith('25519KeypreKey') ||
                key.startsWith('25519KeysignedKey') ||
                key === 'identityKey') {
                const item = JSON.parse(this.store[key]);
                return {
                    pubKey: stringToArrayBuffer(item.pubKey),
                    privKey: stringToArrayBuffer(item.privKey),
                };
            } else if (key.startsWith('identityKey')) {
                return stringToArrayBuffer(this.store[key]);
            } else {
                return JSON.parse(this.store[key]);
            }
        } else {
            return defaultValue;
        }
    }

    remove(key) {
        if (key === null || key === undefined) {
            throw new Error('Tried to remove value for undefined/null key');
        }
        delete this.store[key];
        this._saveToStorage();
    }

    isTrustedIdentity(identifier, identityKey) {
        if (identifier === null || identifier === undefined) {
            throw new Error('tried to check identity key for undefined/null key');
        }
        if (!(identityKey instanceof ArrayBuffer)) {
            throw new Error('Expected identityKey to be an ArrayBuffer');
        }
        let trusted = this.get('identityKey' + identifier);
        if (trusted === undefined) {
            return Promise.resolve(true);
        }
        return Promise.resolve(identityKey.toString() === trusted.toString());
    }

    loadIdentityKey(identifier) {
        if (identifier === null || identifier === undefined) {
            throw new Error('Tried to get identity key for undefined/null key');
        }
        return Promise.resolve(this.get('identityKey' + identifier));
    }

    saveIdentity(identifier, identityKey) {
        if (identifier === null || identifier === undefined) {
            throw new Error('Tried to put identity key for undefined/null key');
        }
        return Promise.resolve(this.put('identityKey' + identifier, identityKey));
    }


    /* Returns a prekeypair object or undefined */
    loadPreKey(keyId) {
        let res = this.get('25519KeypreKey' + keyId);
        if (res !== undefined) {
            res = { pubKey: res.pubKey, privKey: res.privKey };
        }
        return Promise.resolve(res);
    }

    storePreKey(keyId, keyPair) {
        return Promise.resolve(this.put('25519KeypreKey' + keyId, keyPair));
    }

    removePreKey(keyId) {
        this.refreshPreKeys().then(() => this.remove('25519KeypreKey' + keyId));
    }

    /* Returns a signed keypair object or undefined */
    loadSignedPreKey(keyId) {
        let res = this.get('25519KeysignedKey' + keyId);
        if (res !== undefined) {
            res = { pubKey: res.pubKey, privKey: res.privKey };
        }
        return Promise.resolve(res);
    }

    storeSignedPreKey(keyId, keyPair) {
        return Promise.resolve(this.put('25519KeysignedKey' + keyId, keyPair));
    }

    removeSignedPreKey(keyId) {
        return Promise.resolve(this.remove('25519KeysignedKey' + keyId));
    }

    loadSession(identifier) {
        return Promise.resolve(this.get('session' + identifier));
    }

    storeSession(identifier, record) {
        return Promise.resolve(this.put('session' + identifier, record));
    }

    removeSession(identifier) {
        return Promise.resolve(this.remove('session' + identifier));
    }

    removeAllSessions(identifier) {
        for (let id in this.store) {
            if (id.startsWith('session' + identifier)) {
                delete this.store[id];
            }
        }
        this._saveToStorage();
        return Promise.resolve();
    }

    loadMaxPreKeyId() {
        return this.get('maxPreKeyId');
    }

    storeMaxPreKeyId(value) {
        return this.put('maxPreKeyId', value);
    }

    loadSignedKeyId() {
        return this.get('signedKeyId');
    }

    storeSignedKeyId(value) {
        return this.put('signedKeyId', value);
    }

    private _saveToStorage() {
        localStorage.setItem(SIGNAL_STORE, jsonThing(this.store));
    }

    private _getFromStorage() {
        const value = localStorage.getItem(SIGNAL_STORE);
        return value ? JSON.parse(value) : {};
    }

    private _removeFromStorage() {
        localStorage.removeItem(SIGNAL_STORE);
    }
}

export function clearStore() {
    localStorage.removeItem(SIGNAL_STORE);
}
