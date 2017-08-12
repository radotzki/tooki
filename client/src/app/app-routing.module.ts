import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthService } from './auth.service';
import { LoginComponent } from './login/login.component';
import { DocListComponent } from './doc-list/doc-list.component';
import { EditorComponent } from './editor/editor.component';
import { ValidatePasswordComponent } from './validate-password/validate-password.component';

const routes: Routes = [
    { path: '', redirectTo: '/docs', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'validate-password', component: ValidatePasswordComponent },
    { path: 'docs', component: DocListComponent, canActivate: [AuthService] },
    { path: 'doc/:id', component: EditorComponent, canActivate: [AuthService] }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
