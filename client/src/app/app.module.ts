import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AuthService } from './auth.service';
import { DocListService } from './doc-list/doc-list.service';
import { EditorService } from './editor/editor.service';
import { HttpService } from './http.service';
import { SignalService } from './crypto/signal.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DocListComponent } from './doc-list/doc-list.component';
import { EditorComponent } from './editor/editor.component';
import { ValidatePasswordComponent } from './validate-password/validate-password.component';
import { CreateDocDialogComponent } from './create-doc-dialog/create-doc-dialog.component';
import { ShareDialogComponent } from './share-dialog/share-dialog.component';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        DocListComponent,
        EditorComponent,
        ValidatePasswordComponent,
        CreateDocDialogComponent,
        ShareDialogComponent,
    ],
    entryComponents: [
        CreateDocDialogComponent,
        ShareDialogComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        AppRoutingModule,
        MaterialModule.forRoot(),
        FlexLayoutModule.forRoot(),
    ],
    providers: [
        AuthService,
        DocListService,
        EditorService,
        HttpService,
        SignalService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
