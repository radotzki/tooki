import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpService } from './http.service';

const HOUR = 1000 * 60 * 60;

@Component({
    selector: 'app-root',
    template: ' <router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
    constructor(
        private authService: AuthService,
        private httpService: HttpService,
    ) { }

    ngOnInit() {
        if (this.authService.activeUser) {
            this.refreshToken();
            setInterval(this.refreshToken.bind(this), HOUR);
        }
    }

    private refreshToken() {
        this.httpService.refreshToken().subscribe(
            (resp) => {
                const user = Object.assign({}, this.authService.activeUser, { token: resp.token });
                this.authService.activeUser = user;
            },
            () => this.authService.signout,
        );
    }
}
