import { MdDialogRef } from '@angular/material';
import { Component } from '@angular/core';
import { DocListService } from './../doc-list/doc-list.service';

@Component({
    selector: 'app-create-doc-dialog',
    templateUrl: './create-doc-dialog.component.html',
    styleUrls: ['./create-doc-dialog.component.css']
})
export class CreateDocDialogComponent {

    constructor(
        private dialogRef: MdDialogRef<CreateDocDialogComponent>,
        private docListService: DocListService,
        ) { }

    createDoc(name: string) {
        this.docListService.create(name).subscribe(
            (resp) => this.dialogRef.close(resp),
        );
    }
}
