// tslint:disable

declare var dcodeIO: any;
declare var ArrayBuffer: any;
declare var Uint8Array: any;

let StaticByteBufferProto = new dcodeIO.ByteBuffer().__proto__;
let StaticArrayBufferProto = new ArrayBuffer().__proto__;
let StaticUint8ArrayProto = new Uint8Array().__proto__;

export function getString(thing) {
    if (thing === Object(thing)) {
        if (thing.__proto__ === StaticUint8ArrayProto) {
            return String.fromCharCode.apply(null, thing);
        }

        if (thing.__proto__ === StaticArrayBufferProto) {
            return getString(new Uint8Array(thing));
        }

        if (thing.__proto__ === StaticByteBufferProto) {
            return thing.toString('binary');
        }

    }
    return thing;
}

export function jsonThing(thing) {
    return JSON.stringify(ensureStringed(thing));
}

export function base64ToBytes(sBase64, nBlocksSize?) {
    let
        sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
    let aBBytes = new ArrayBuffer(nOutLen);
    let taBytes = new Uint8Array(aBBytes);

    for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++ , nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0;
        }
    }
    return aBBytes;
}

export function stringToArrayBuffer(str) {
    if (typeof str !== 'string') {
        throw new Error('Passed non-string to stringToArrayBuffer');
    }
    const res = new ArrayBuffer(str.length);
    const uint = new Uint8Array(res);
    for (let i = 0; i < str.length; i++) {
        uint[i] = str.charCodeAt(i);
    }
    return res;
}

function b64ToUint6(nChr) {
    return nChr > 64 && nChr < 91 ?
        nChr - 65
        : nChr > 96 && nChr < 123 ?
            nChr - 71
            : nChr > 47 && nChr < 58 ?
                nChr + 4
                : nChr === 43 ?
                    62
                    : nChr === 47 ?
                        63
                        :
                        0;
}

function getStringable(thing) {
    return (typeof thing === 'string' || typeof thing === 'number' || typeof thing === 'boolean' ||
        (thing === Object(thing) &&
            (thing.__proto__ === StaticArrayBufferProto ||
                thing.__proto__ === StaticUint8ArrayProto ||
                thing.__proto__ === StaticByteBufferProto)));
}

function ensureStringed(thing) {
    if (getStringable(thing)) {
        return getString(thing);
    } else if (thing instanceof Array) {
        let res = [];
        for (let i = 0; i < thing.length; i++) {
            res[i] = ensureStringed(thing[i]);
        }
        return res;
    } else if (thing === Object(thing)) {
        let res = {};
        for (let key in thing) {
            res[key] = ensureStringed(thing[key]);
        }
        return res;
    } else if (thing === null) {
        return null;
    }

    throw new Error('unsure of how to jsonify object of type ' + typeof thing);
}
