import { stringToArrayBuffer, getString, base64ToBytes } from './string-utils';

const algoOpts = {
    name: 'AES-GCM',
    tagLength: 128,
};
const keyOpts = {
    format: 'raw',
    extractable: false,
    usages: ['encrypt', 'decrypt'],
};
const pbkdfOpts = {
    format: 'raw',
    name: 'PBKDF2',
    extractable: false,
    usages: ['deriveBits'],
    iterations: 1000,
    hashName: 'SHA-512',
    bits: 256,
};

export function symmetricEncrypt(message: Object, secret: string) {
    let raw = base64ToBytes(secret);
    let data = stringToArrayBuffer(JSON.stringify(message));
    return importKey(raw).then(key => encryptWithKey(key, data));
}

export function symmetricDecrypt(message: string, secret: string) {
    let raw = base64ToBytes(secret);
    let msg = JSON.parse(atob(message));
    let data = base64ToBytes(msg.data);
    let iv = base64ToBytes(msg.iv);
    return importKey(raw).then(key => decryptWithKey(key, data, iv));
}

export function pbkdf2(password: string, salt: string) {
    const algo = {
        name: pbkdfOpts.name,
        salt: stringToArrayBuffer(salt),
        iterations: pbkdfOpts.iterations,
        hash: { name: pbkdfOpts.hashName },
    };

    return importPbkdfKey(stringToArrayBuffer(password))
        .then(key => window.crypto.subtle.deriveBits(algo, key, pbkdfOpts.bits))
        .then(bits => {
            const pbkdfString = getString(new Uint8Array(bits));
            const authSecret = btoa(pbkdfString.slice(0, pbkdfString.length / 2));
            const keysSecret = btoa(pbkdfString);
            return { authSecret, keysSecret };
        });
}

function importPbkdfKey(secret) {
    return window.crypto.subtle.importKey(
        pbkdfOpts.format,
        secret,
        { name: pbkdfOpts.name },
        pbkdfOpts.extractable,
        pbkdfOpts.usages
    );
}

function importKey(secret: ArrayBuffer) {
    return window.crypto.subtle.importKey(
        keyOpts.format,
        secret,
        { name: algoOpts.name },
        keyOpts.extractable,
        keyOpts.usages,
    );
}

function encryptWithKey(key, data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const algo = { name: algoOpts.name, iv, tagLength: algoOpts.tagLength };

    return window.crypto.subtle.encrypt(algo, key, data)
        .then(encrypted => ({ data: btoa(getString(new Uint8Array(encrypted))), iv: btoa(getString(iv)) }))
        .then(encrypted => JSON.stringify(encrypted))
        .then(encrypted => btoa(encrypted));
}

function decryptWithKey(key, data, iv): PromiseLike<Object> {
    const algo = { name: algoOpts.name, iv, tagLength: algoOpts.tagLength };

    return window.crypto.subtle.decrypt(algo, key, data)
        .then(decrypted => JSON.parse(getString(decrypted)));
}
