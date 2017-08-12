import { Observable, ReplaySubject } from 'rxjs';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { clearStore } from './crypto/signal-store';
import * as tk from './interfaces';

const storageKey = 'TK_SESSION';

@Injectable()
export class AuthService implements CanActivate {
    private _activeUser: tk.user;

    constructor(
        private router: Router,
        private http: Http,
    ) { }

    set activeUser(user: tk.user) {
        this._activeUser = user;
        localStorage.setItem(storageKey, JSON.stringify(user));
    }

    get activeUser() {
        if (this._activeUser) {
            return this._activeUser;
        }

        try {
            return JSON.parse(localStorage.getItem(storageKey));
        } catch (e) {
            return undefined;
        }
    }

    signin(email: string) {
        return this.http.post(`${environment.api}/signin`, { user: email });
    }

    register(token: string, email: string, authSecret: string): Observable<{ id: string, token: string }> {
        return this.http
            .post(`${environment.api}/register`, { token, email, authSecret })
            .map(resp => resp.json());
    }

    validatePassword(token: string, email: string, authSecret: string): Observable<{ token: string, id: string }> {
        return this.http
            .post(`${environment.api}/validate-password`, { token, email, authSecret })
            .map(resp => resp.json());
    }

    signout() {
        localStorage.removeItem(storageKey);
        clearStore();
        this.router.navigate(['login']);
    }

    canActivate() {
        if (this.activeUser) {
            return true;
        } else {
            this.router.navigate(['login']);
            return false;
        }
    }
}
