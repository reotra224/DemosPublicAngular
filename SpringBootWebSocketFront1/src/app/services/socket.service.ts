import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Message } from '../model/message';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  url: string = environment.url + "api/socket";

  constructor(private http: HttpClient) { }

  post(data: Message): Observable<HttpResponse<Message>> {
    return this.http.post<Message>(this.url, data, { observe: 'response' });
      //.pipe(res => {return res});
  }
}
