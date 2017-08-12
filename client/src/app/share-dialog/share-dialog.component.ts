import { MdDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
    selector: 'app-share-dialog',
    templateUrl: './share-dialog.component.html',
    styleUrls: ['./share-dialog.component.css']
})
export class ShareDialogComponent {

    constructor(
        private dialogRef: MdDialogRef<ShareDialogComponent>,
    ) { }

    share(recipient: string) {
        setTimeout(() => this.dialogRef.close(recipient));
    }
}
