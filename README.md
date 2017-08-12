# Tooki - Secure Collaborative Text Editor

This is a secure collaborative text editor using:
1. [Signal Protocol](https://github.com/WhisperSystems/libsignal-protocol-javascript)
1. [Quill](https://github.com/quilljs/quill)

## Docker
1. If you are using docker-machine, replace the API IP in the client config (client/src/environments/environment.ts) to the machine ip. (`docker-machine ip`)
1. Run: `$> docker-compose up`
1. Open a browser and go to `localhost:4200`

## Comments
1. We believe that the code is clear and really easy to read and understand so we did not wrote a lot of comments inside the code.
1. In addition you can use the following section in order to understand where are the interesting files.

## Interesting files in the project (in terms of cryptography)
1. client/src/app/validate-password/validate-password.component.ts
    - handle registration and validation of exist users.
    - make use of pbkdf2 in order to create a secret from user's password.
1. client/src/app/editor/editor.service.ts
    - get doc flow (apply journal operations, etc)
    - subscribe to the queue
    - send messages to recipients
    - invite new member
    - subscribe to online users
1. client/src/app/editor/ot.service.ts
    - our modifications to the OT algorithm, in order to make it play with out a server.
1. client/src/app/crypto/signal.service.ts
    - implementaion of the necessary signal functions including: createAccount, generateKeys, refreshPreKeys, encryption and decryption.
1. client/src/app/crypto/web-crypto.ts
    - using the built-in browser's implementaion of AES-GCM and PBKDF2 algorithms
1. server/app/controllers/docs.js
    - server side for the doc model. Responisble for all requests that related to documents.
1. server/app/controllers/keys.js
    - server side for the key model. Responisble for all requests that related to keys. Contains both public keys and encrypted private keys.
