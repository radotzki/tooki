import { Component } from '@angular/core';
import { AuthService } from './../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    mailSent: boolean;

    constructor(
        private authService: AuthService,
    ) { }

    login(email) {
        this.mailSent = true;
        this.authService.signin(email).subscribe(
            null,
            console.error
        );
    }
}
