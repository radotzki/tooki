import { MdDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';

import { CreateDocDialogComponent } from './../create-doc-dialog/create-doc-dialog.component';
import { AuthService } from './../auth.service';
import { DocListService } from './doc-list.service';
import * as tk from '../interfaces';

@Component({
    selector: 'app-doc-list',
    templateUrl: './doc-list.component.html',
    styleUrls: ['./doc-list.component.css']
})
export class DocListComponent implements OnInit {
    email: string;
    docs: tk.doc[];

    constructor(
        private docListService: DocListService,
        private authService: AuthService,
        private dialog: MdDialog,
    ) { }

    ngOnInit() {
        this.email = this.authService.activeUser.email;
        this.getMyDocs();
    }

    open(doc: tk.doc) {
        window.open(`${location.origin}/doc/${doc.id}`, '_blank');
    }

    signout() {
        this.authService.signout();
    }

    openCreateDocDialog() {
        let dialogRef = this.dialog.open(CreateDocDialogComponent);
        dialogRef.afterClosed().subscribe(resp => {
            if (resp) {
                this.docs.push(resp.doc);
            }
        });
    }

    private getMyDocs() {
        this.docListService.getMyDocs().subscribe(
            resp => {
                this.docs = resp.docs;
            },
            err => {
                console.log(err);
            });
    }
}
