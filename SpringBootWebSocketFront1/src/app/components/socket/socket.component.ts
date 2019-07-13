import { Component, OnInit } from '@angular/core';
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import { SocketService } from '../../services/socket.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Message } from 'src/app/model/message';

@Component({
  selector: 'app-socket',
  templateUrl: './socket.component.html',
  styleUrls: ['./socket.component.css']
})
export class SocketComponent implements OnInit {

  private serverUrl = environment.url + 'socket'
  isLoaded: boolean = false;
  isCustomSocketOpened = false;
  private stompClient;
  private form: FormGroup;
  private userForm: FormGroup;
  messages: Message[] = [];

  constructor(
    private socketService: SocketService, 
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      message: new FormControl(null, [Validators.required])
    })
    this.userForm = new FormGroup({
      fromId: new FormControl(null, [Validators.required]),
      toId: new FormControl(null)
    })
    //On initialise la connexion au Serveur
    this.initializeWebSocketConnection();
  }

  //Envoi du message avec un socket
  sendMessageUsingSocket() {
    if (this.form.valid) {
      let message: Message = { 
        message: this.form.value.message, 
        fromId: this.userForm.value.fromId, 
        toId: this.userForm.value.toId 
      };
      this.stompClient.send("/socket-subscriber/send/message", {}, JSON.stringify(message));
    }
  }

  //Envoi du message avec une API REST
  sendMessageUsingRest() {
    if (this.form.valid) {
      let message: Message = { 
        message: this.form.value.message, 
        fromId: this.userForm.value.fromId, 
        toId: this.userForm.value.toId 
      };
      this.socketService.post(message).subscribe(res => {
        console.log(res.body);
      });
    }
  }

  //Initialisation du socket
  initializeWebSocketConnection() {
    let ws = new SockJS(this.serverUrl);
    this.stompClient = Stomp.over(ws);
    let that = this;
    this.stompClient.connect({}, function (frame) {
      that.isLoaded = true;
      that.openGlobalSocket()
    });
  }

  //Ouverture de la chaine de difusion
  openGlobalSocket() {
    this.stompClient.subscribe("/socket-publisher", (message) => {
      this.handleResult(message);
    });
  }

  //Ouverture de la chaine privé
  openSocket() {
    //Si la connexion est établie
    if (this.isLoaded) {
      //On ouvre le socket privé
      this.isCustomSocketOpened = true;
      this.stompClient.subscribe("/socket-publisher/" + this.userForm.value.fromId, (message) => {
        this.handleResult(message);
      });
    }
  }

  handleResult(message){
    //Si la réponse contient des data
    if (message.body) {
      //On le convertit en JSON pour le récupérer
      let messageResult: Message = JSON.parse(message.body);
      console.log(messageResult);
      this.messages.push(messageResult);
      this.toastr.success("new message recieved", null, {
        'timeOut': 3000
      });
    }
  }

  disconnect() {
    if(this.stompClient != null) {
      this.stompClient.disconnect();
      this.isLoaded = false;
      console.log("Disconnected");
    } else {
      console.log("You are not connected");
    }
  }

  connect() {
    //On initialise la connexion au Serveur
    this.initializeWebSocketConnection();
    this.isLoaded = true;
    console.log("You are connected");
  }

}
