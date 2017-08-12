declare var libsignal: any;

import { Injectable } from '@angular/core';
import { SignalStore } from './signal-store';
import { getString, stringToArrayBuffer, base64ToBytes } from './string-utils';
import { AuthService } from './../auth.service';
import { HttpService } from './../http.service';
import { environment } from '../../environments/environment';
import { symmetricEncrypt, symmetricDecrypt } from './web-crypto';

const deviceId = 0;
const PREKEY_BUNDLE = 3;
const CIPHERTEXT = 1;

@Injectable()
export class SignalService {
    signalStore: SignalStore;

    constructor(
        private httpService: HttpService,
        private authService: AuthService,
    ) {
        this.signalStore = new SignalStore(this.refreshPreKeys.bind(this));
    }

    registerDevice(email: string, keysSecret: string): Promise<{ identityKey, signedPreKey, preKeys, registrationId }> {
        return libsignal.KeyHelper.generateIdentityKeyPair()
            .then(identityKeyPair => this.createAccount(email, identityKeyPair))
            .then(this.generateKeys.bind(this))
            .then(this.registerKeys.bind(this))
            .then(() => this.savePrivateKeys(keysSecret));
    }

    private createAccount(email: string, identityKeyPair) {
        const registrationId = libsignal.KeyHelper.generateRegistrationId();
        this.signalStore.saveIdentity(email, identityKeyPair.pubKey);
        this.signalStore.storeIdentityKeyPair(identityKeyPair);
        this.signalStore.storeLocalRegistrationId(registrationId);
    }

    private generateKeys(count = 100) {
        let startId = this.signalStore.loadMaxPreKeyId() || 1;
        let signedKeyId = this.signalStore.loadSignedKeyId() || 1;

        return this.signalStore.getIdentityKeyPair().then(identityKey => {
            let result = { preKeys: [], identityKey: identityKey.pubKey, signedPreKey: null };
            let promises = [];

            for (let keyId = startId; keyId < startId + count; ++keyId) {
                promises.push(
                    libsignal.KeyHelper.generatePreKey(keyId).then(res => {
                        this.signalStore.storePreKey(res.keyId, res.keyPair);
                        result.preKeys.push({
                            keyId: res.keyId,
                            publicKey: res.keyPair.pubKey
                        });
                    })
                );
            }

            promises.push(
                libsignal.KeyHelper.generateSignedPreKey(identityKey, signedKeyId).then(res => {
                    this.signalStore.storeSignedPreKey(res.keyId, res.keyPair);
                    result.signedPreKey = {
                        keyId: res.keyId,
                        publicKey: res.keyPair.pubKey,
                        signature: res.signature
                    };
                })
            );

            this.signalStore.removeSignedPreKey(signedKeyId - 2);
            this.signalStore.storeMaxPreKeyId(startId + count);
            this.signalStore.storeSignedKeyId(signedKeyId + 1);
            return Promise.all(promises).then(() => result);
        });
    }

    private registerKeys(genKeys): Promise<{ identityKey, signedPreKey, preKeys, registrationId }> {
        const identityKey = btoa(getString(genKeys.identityKey));
        const signedPreKey = {
            keyId: genKeys.signedPreKey.keyId,
            publicKey: btoa(getString(genKeys.signedPreKey.publicKey)),
            signature: btoa(getString(genKeys.signedPreKey.signature))
        };

        const preKeys = [];
        let j = 0;
        // tslint:disable-next-line:forin
        for (let i in genKeys.preKeys) {
            preKeys[j++] = {
                keyId: genKeys.preKeys[i].keyId,
                publicKey: btoa(getString(genKeys.preKeys[i].publicKey))
            };
        }

        return this.signalStore
            .getLocalRegistrationId()
            .then(registrationId => ({ identityKey, signedPreKey, preKeys, registrationId }))
            .then(this.savePublicKeys.bind(this));
    }

    private savePublicKeys(keys) {
        const {identityKey, signedPreKey, preKeys, registrationId} = keys;
        return this.httpService
            .post(`${environment.api}/keys`, { identityKey, signedPreKey, preKeys, registrationId })
            .toPromise();
    }

    private savePrivateKeys(keysSecret: string) {
        return symmetricEncrypt(this.signalStore, keysSecret)
            .then(encryptedPrivateKeys =>
                this.httpService.post(`${environment.api}/keys/private`, { privateKeys: encryptedPrivateKeys }).toPromise()
            );
    }

    refreshPreKeys(): Promise<any> {
        return this.httpService
            .get(`${environment.api}/keys/prekeys-count`)
            .toPromise()
            .then((resp: { count: number }) => {
                if (resp.count < 10) {
                    return this.generateKeys().then(this.registerKeys.bind(this));
                }
            });
    }

    encryptToRecipients(sender: string, recipients: string[], message: string): Promise<{ encryptedMsg: string, recipient: string }[]> {
        let promises = [];
        recipients.forEach(recipient =>
            promises.push(this.encrypt(sender, recipient, message).then(encryptedMsg => ({ encryptedMsg, recipient })))
        );
        return Promise.all(promises);
    }

    encrypt(sender: string, recipient: string, message: string): Promise<string> {
        return this.isStale(recipient)
            .then(isStale => this.getKeysForEmail(recipient, isStale))
            .then(() => {
                let plaintext = stringToArrayBuffer(message);
                let address = new libsignal.SignalProtocolAddress(recipient, deviceId);
                let sessionCipher = new libsignal.SessionCipher(this.signalStore, address);
                return sessionCipher
                    .encrypt(plaintext)
                    .then(ciphertext => this.toJSON(sender, ciphertext))
                    .then(JSON.stringify)
                    .then((resp) => {
                        this.savePrivateKeys(this.authService.activeUser.keysSecret);
                        return resp;
                    });
            });
    }

    private toJSON(sender, encryptedMsg) {
        return {
            sender,
            type: encryptedMsg.type,
            destinationRegistrationId: encryptedMsg.registrationId,
            content: btoa(encryptedMsg.body),
        };
    }

    private isStale(recipient): Promise<boolean> {
        const address = new libsignal.SignalProtocolAddress(recipient, deviceId);
        const sessionCipher = new libsignal.SessionCipher(this.signalStore, address);
        return sessionCipher.hasOpenSession().then(hasSession => !hasSession);
    }

    private getKeysForEmail(email: string, update: boolean): Promise<any> {
        if (update) {
            return this.fetchKeysFromServer(email).then(res => {
                const address = new libsignal.SignalProtocolAddress(email, deviceId);
                const builder = new libsignal.SessionBuilder(this.signalStore, address);
                return builder.processPreKey(res).catch((error) => {
                    console.log(error.message);
                });
            });
        } else {
            return Promise.resolve();
        }
    }

    private fetchKeysFromServer(email: string) {
        return this.httpService
            .get(`${environment.api}/keys/${email}`)
            .map((res: { identityKey, signedPreKey, preKey, registrationId }) => {
                res.identityKey = base64ToBytes(res.identityKey);
                res.signedPreKey.publicKey = base64ToBytes(res.signedPreKey.publicKey);
                res.signedPreKey.signature = base64ToBytes(res.signedPreKey.signature);
                res.preKey.publicKey = base64ToBytes(res.preKey.publicKey);
                return res;
            })
            .toPromise()
            .catch(err => {
                console.log('err', err);
            });
    }

    decrypt(encryptedMsg): Promise<string> {
        let promise;
        let ciphertext = base64ToBytes(encryptedMsg.content);
        let address = new libsignal.SignalProtocolAddress(encryptedMsg.sender, deviceId);
        let sessionCipher = new libsignal.SessionCipher(this.signalStore, address);
        switch (encryptedMsg.type) {
            case CIPHERTEXT:
                promise = sessionCipher.decryptWhisperMessage(ciphertext);
                break;
            case PREKEY_BUNDLE:
                promise = this.decryptPreKeyWhisperMessage(ciphertext, sessionCipher, address);
                break;
            default:
                promise = Promise.reject(new Error('Unknown message type'));
        }

        return promise.then(getString);
    }

    private decryptPreKeyWhisperMessage(ciphertext, sessionCipher, address) {
        return sessionCipher.decryptPreKeyWhisperMessage(ciphertext);
    }

    getSignalStoreFromServer(keysSecret: string) {
        return this.getPrivateKeys(keysSecret)
            .then((store) => this.signalStore.setStore(store.store));
    }

    private getPrivateKeys(keysSecret: string): Promise<SignalStore> {
        return this.httpService
            .get(`${environment.api}/keys/private`)
            .toPromise()
            .then((res: { privateKeys: string }) => symmetricDecrypt(res.privateKeys, keysSecret));
    }
}
