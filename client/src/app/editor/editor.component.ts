import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MdDialog } from '@angular/material';
import * as Quill from 'quill';
const Delta = require('quill-delta');

import { ShareDialogComponent } from './../share-dialog/share-dialog.component';
import { AuthService } from './../auth.service';
import { EditorService } from './editor.service';
import * as tk from '../interfaces';

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, OnDestroy {
    doc: tk.doc;
    quill: Quill.Quill;
    player: tk.player;
    leader: boolean;
    queueSubscription: Subscription;
    docUsers: { email: string, active: boolean }[];

    constructor(
        private activatedRoute: ActivatedRoute,
        private editorService: EditorService,
        private authService: AuthService,
        private dialog: MdDialog,
    ) { }

    ngOnInit() {
        this.quill = new Quill('#editor', { theme: 'snow' });
        const docId = this.activatedRoute.snapshot.params['id'];
        this.initDoc(docId);
    }

    ngOnDestroy() {
        this.queueSubscription.unsubscribe();
    }

    openShareDialog() {
        const dialogRef = this.dialog.open(ShareDialogComponent);
        dialogRef.afterClosed().toPromise().then(recipient => {
            if (!recipient) {
                return;
            }

            this.editorService.invite(this.doc, recipient, this.player)
                .then(() => {
                    this.docUsers.push({ email: recipient, active: false });
                    this.doc.users.push(recipient);
                });
        });
    }

    private initDoc(docId) {
        this.editorService.getDoc(docId).then(
            (resp) => {
                this.doc = resp.doc;
                this.player = resp.player;
                this.quill.setContents(new Delta(this.player.snapshot));

                this.quill.on('text-change', (delta: tk.delta, oldDelta, source) => {
                    if (source === 'user') {
                        this.player = this.editorService.submitOp(this.doc, this.player, delta);
                    }
                });

                this.queueSubscription = this.editorService.queue(this.doc.id).subscribe(
                    (message) => {
                        if (message.type === tk.messageType.operation) {
                            this.onNewOperation(message.operation);
                        } else if (message.type === tk.messageType.newcomer) {
                            this.onNewcomer(message.newcomer);
                        }
                    },
                    console.error,
                );

                this.docUsers = this.doc.users.map(user => ({ email: user, active: false }));
                this.editorService.onlineUsers(this.doc.id).subscribe(onlineUsers => {
                    this.docUsers = this.docUsers.map(user => {
                        user.active = onlineUsers.indexOf(user.email) > -1;
                        return user;
                    });
                });
            },
            console.error);
    }

    private onNewOperation(op: tk.operation) {
        const { player, moves } = this.editorService.applyOp(this.player, op);
        this.player = player;
        moves.forEach(m => this.quill.updateContents(new Delta(m)));
    }

    private onNewcomer(newcomer: string) {
        this.doc.users.push(newcomer);
    }
}
