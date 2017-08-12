import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './../auth.service';
import { SignalService } from './../crypto/signal.service';
import { pbkdf2 } from './../crypto/web-crypto';

@Component({
    selector: 'app-validate-password',
    templateUrl: './validate-password.component.html',
    styleUrls: ['./validate-password.component.css']
})
export class ValidatePasswordComponent implements OnInit {
    userParams: { token: string, email: string };
    newUser: boolean;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private signalService: SignalService,
    ) { }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe(
            (params: { token: string, register: string, email: string }) => {
                this.userParams = { token: params.token, email: params.email };
                this.newUser = params.register === 'true';

                if (!this.userParams.token || !this.userParams.email) {
                    this.router.navigate(['login']);
                }
            },
        );
    }

    register(password: string) {
        pbkdf2(password, this.userParams.email)
            .then(({authSecret, keysSecret}) =>
                this.authService.register(this.userParams.token, this.userParams.email, authSecret).toPromise()
                    .then(resp => this.setActiveUser(resp.id, this.userParams.email, resp.token, keysSecret))
                    .then(() => this.signalService.registerDevice(this.userParams.email, keysSecret))
                    .then(() => this.router.navigate(['docs']))
            );
    }

    validate(password: string) {
        pbkdf2(password, this.userParams.email)
            .then(({authSecret, keysSecret}) =>
                this.authService
                    .validatePassword(this.userParams.token, this.userParams.email, authSecret).toPromise()
                    .then(resp => this.setActiveUser(resp.id, this.userParams.email, resp.token, keysSecret))
                    .then(() => this.signalService.getSignalStoreFromServer(keysSecret))
                    .then(() => this.router.navigate(['docs']))
            );
    }

    private setActiveUser(id, email, token, keysSecret) {
        this.authService.activeUser = { id, email, token, keysSecret };
    }
}
