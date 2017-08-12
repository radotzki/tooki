import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';
const md5 = require('md5');

import { environment } from '../../environments/environment';
import { HttpService } from './../http.service';
import { AuthService } from './../auth.service';
import { SignalService } from './../crypto/signal.service';
import { symmetricEncrypt, symmetricDecrypt } from './../crypto/web-crypto';
import { applyOp } from './ot.service';
import * as tk from '../interfaces';

@Injectable()
export class EditorService {
    private _socket: SocketIOClient.Socket;
    private oldMessages: string[] = [];

    constructor(
        private http: HttpService,
        private authService: AuthService,
        private signalService: SignalService,
    ) { }

    getDoc(docId: string): Promise<{ doc: tk.doc, player: tk.player }> {
        return this.http.get(`${environment.api}/doc/${docId}`).toPromise()
            .then((doc: any) => {
                return Promise
                    .all(doc.journal.map(item => symmetricDecrypt(item, this.authService.activeUser.keysSecret)))
                    .then(journal => {
                        doc.journal = journal;
                        return doc;
                    });
            })
            .then((doc: tk.doc) => {
                const player = this.createPlayer(doc);
                return { doc, player };
            })
            .then((resp) => this.shrinkJournal(resp.doc.id, resp.player).then(() => resp));
    }

    queue(docId: string): Observable<tk.message> {
        return Observable
            .fromEvent(this.getSocket(docId), 'broadcast')
            .filter((item: { message: string, id: string }) => this.oldMessages.indexOf(item.id) === -1)
            .do((item: { message: string, id: string }) => this.ackMessage(docId, item.id))
            .do((item: { message: string, id: string }) => this.oldMessages.push(item.id))
            .concatMap((item: { message: string, id: string }) =>
                this.signalService.decrypt(JSON.parse(item.message)).then(plain => JSON.parse(plain) as tk.message))
            .do((message: tk.message) => this.sendMessageToJournal(docId, message));
    }

    submitOp(doc: tk.doc, player: tk.player, delta: tk.delta): tk.player {
        const hash = this.createHashFromOp();
        const v = player.snapshot.v;
        const op: tk.operation = Object.assign({}, delta, { v, hash });
        const message = { type: tk.messageType.operation, operation: op };
        const recipients = doc.users.filter(user => user !== this.authService.activeUser.email);
        this.sendMessageToRecipients(doc, message, recipients);
        this.sendMessageToJournal(doc.id, message);
        return applyOp(player, op).player;
    }

    private createPlayer(docInfo: tk.doc): tk.player {
        let player = { snapshot: { ops: [{ insert: '' }], v: 0 }, ops: [] };
        docInfo.journal
            .filter(message => message.type === tk.messageType.operation)
            .forEach(message => player = applyOp(player, message.operation).player);

        return player;
    }

    applyOp(player: tk.player, ops: tk.operation): { player: tk.player, moves: tk.operation[] } {
        return applyOp(player, ops);
    }

    invite(doc: tk.doc, recipient: string, player: tk.player) {
        const sender = this.authService.activeUser.email;
        const message = { type: tk.messageType.operation, operation: { ops: player.snapshot.ops, v: player.snapshot.v - 1 } };
        return this.signalService.encrypt(sender, recipient, JSON.stringify(message))
            .then((encryptedMsg) =>
                this.http.post(`${environment.api}/doc/${doc.id}/invite`, { recipient, message: encryptedMsg }).toPromise()
            )
            .then(() => {
                const newcomerMessage: tk.message = { type: tk.messageType.newcomer, newcomer: recipient };
                const recipients = doc.users.filter(user => user !== sender && user !== recipient);
                this.sendMessageToRecipients(doc, newcomerMessage, recipients);
            });
    }

    onlineUsers(docId: string): Observable<string[]> {
        return Observable.fromEvent(this.getSocket(docId), 'online-users');
    }

    private sendMessageToRecipients(doc: tk.doc, message: tk.message, recipients: string[]) {
        const msg = JSON.stringify(message);
        const sender = this.authService.activeUser.email;
        return this.signalService.encryptToRecipients(sender, recipients, msg)
            .then(messages => messages.forEach(item =>
                this.getSocket(doc.id).emit('message-to-queue', { recipient: item.recipient, message: item.encryptedMsg }))
            );
    }

    private sendMessageToJournal(docId: string, message: tk.message) {
        symmetricEncrypt(message, this.authService.activeUser.keysSecret).then(encryptedMsg => {
            this.getSocket(docId).emit('message-to-journal', encryptedMsg);
        });
    }

    private ackMessage(docId: string, messageId: string) {
        this.getSocket(docId).emit('message-ack', messageId);
    }

    private createHashFromOp(): string {
        return md5(Date.now().toString() + this.authService.activeUser.id);
    }

    private getSocket(docId) {
        if (!this._socket) {
            this._socket = io(`${environment.api}/?token=${this.authService.activeUser.token}&docId=${docId}`);
        }

        return this._socket;
    }

    private shrinkJournal(docId: string, player: tk.player) {
        const hash = this.createHashFromOp();
        const op: tk.operation = Object.assign({}, player.snapshot, { hash, v: player.snapshot.v - 1 });
        const message = { type: tk.messageType.operation, operation: op };
        return symmetricEncrypt(message, this.authService.activeUser.keysSecret)
            .then(encryptedMsg => this.http.post(`${environment.api}/doc/${docId}/shrink-journal`, { message: encryptedMsg }).toPromise());
    }
}
