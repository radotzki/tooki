import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './../auth.service';
import { HttpService } from './../http.service';
import { environment } from '../../environments/environment';
import * as tk from '../interfaces';

@Injectable()
export class DocListService {

    constructor(
        private http: HttpService,
        private authService: AuthService,
    ) { }

    getMyDocs(): Observable<any> {
        return this.http.get(`${environment.api}/docs`);
    }

    create(name: string): Observable<{ doc: tk.doc }> {
        return this.http.post(`${environment.api}/docs`, { name });
    }
}

