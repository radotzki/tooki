# Tooki - Secure Collaborative Rich Text Editor

This is a secure collaborative rich text editor using:
1. [Signal Protocol](https://github.com/WhisperSystems/libsignal-protocol-javascript)
1. [Quill](https://github.com/quilljs/quill)
1. [rich-text OT type](https://github.com/ottypes/rich-text)

## How to config development environment
1. Install mongodb
1. Clone client project `$> git clone https://gitlab.com/tooki/client.git`
1. Clone server project `$> git clone https://gitlab.com/tooki/server.git`

## How to run the app locally
1. Start a mongod process
    - Mac: `$> mongod`
    - Windows: `$> C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe`
1. Start the server: `$> npm start` (from server project folder)
1. Start the client: `$> npm start` (from client project folder)

## Configure server deploy environment
1. Install Heroku
1. Login to heroku: `$> heroku login`
1. Go inside the server project folder and run: `$> heroku git:remote -a tooki-server`

## Configure client deploy environment
1. Login to Surge: `$> node_modules/.bin/surge login` (from client project folder)

## Deploy
1. Server: `$> npm run deploy` (from server project folder)
1. Client: `$> npm run deploy` (from client project folder)
