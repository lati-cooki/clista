// identity.js — writers are keys, not accounts.
// v1 keystore is custodial (keys live in the hub DB) so human writers
// never touch key material. The record format does not know or care:
// a self-hosted instance can hold its own keys and records remain
// verifiable anywhere because every record carries the public key.
'use strict';
const crypto = require('node:crypto');

// Returns { publicKeyHex, privateKeyPem }
function generateKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const publicKeyHex = publicKey
    .export({ type: 'spki', format: 'der' })
    .subarray(-32) // raw 32-byte ed25519 key at the end of SPKI DER
    .toString('hex');
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  return { publicKeyHex, privateKeyPem };
}

function sign(messageHex, privateKeyPem) {
  const key = crypto.createPrivateKey(privateKeyPem);
  return crypto.sign(null, Buffer.from(messageHex, 'hex'), key).toString('hex');
}

function publicKeyFromHex(publicKeyHex) {
  // Rebuild SPKI DER: fixed ed25519 prefix + raw key
  const prefix = Buffer.from('302a300506032b6570032100', 'hex');
  const der = Buffer.concat([prefix, Buffer.from(publicKeyHex, 'hex')]);
  return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
}

function verify(messageHex, signatureHex, publicKeyHex) {
  try {
    const key = publicKeyFromHex(publicKeyHex);
    return crypto.verify(
      null,
      Buffer.from(messageHex, 'hex'),
      key,
      Buffer.from(signatureHex, 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = { generateKeypair, sign, verify };
