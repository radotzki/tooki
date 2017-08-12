import { Http, RequestOptionsArgs, Headers, RequestOptions, RequestMethod, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Injectable()
export class HttpService {

    constructor(
        private http: Http,
        private authService: AuthService,
    ) { }

    post(url: string, body: Object, options?: RequestOptionsArgs) {
        return this.request(RequestMethod.Post, url, Object.assign({}, options, { body }));
    }

    get(url: string, options?: RequestOptionsArgs) {
        return this.request(RequestMethod.Get, url, options);
    }

    delete(url: string, options?: RequestOptionsArgs) {
        return this.request(RequestMethod.Delete, url, options);
    }

    refreshToken(): Observable<{ token: string }> {
        return this.post(`${environment.api}/refresh-token`, {});
    }

    private request(method: RequestMethod, url: string, options: RequestOptionsArgs = {}) {
        const _options = Object.assign({}, options, { method }, { headers: this.getHeadersWithAuth(options.headers) });
        return this.http
            .request(url, _options)
            .map(resp => resp.json())
            .catch((err: Response) => {
                if (err.status === 401) {
                    this.authService.signout();
                    return Observable.of({});
                }

                return Observable.throw(err);
            });
    }

    private getHeadersWithAuth(headers: Headers | null): Headers {
        const headerName = 'Authorization';
        const headerValue = `Bearer ${this.authService.activeUser.token}`;

        if (!headers) {
            return new Headers({ [headerName]: headerValue });
        }

        headers.append(headerName, headerValue);
        return headers;
    }
}
