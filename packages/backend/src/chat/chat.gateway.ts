import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
import {
  SocketEvents,
  ChatRequest,
  ChatResponse,
  ChatResponseType,
} from '../../proto/lobbyProto';
import { SocketUser } from '../users/users.socket';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) {}

  @SubscribeMessage(SocketEvents.ALL_CHAT_TO_SERVER)
  async handleMessage(socket: SocketUser, chatRequest: ChatRequest) {
    if (chatRequest.text) {
      this.logger.log(
        `All chat message: ${socket.user.username}: ${chatRequest.text} `,
      );

      const chatResponse: ChatResponse = {
        text: chatRequest.text,
        username: socket.user.displayUsername,
        timestamp: new Date(),
        type: ChatResponseType.CHAT,
      };

      this.chatService.storeMessage(chatResponse);
      this.server
        .to('lobby')
        .emit(SocketEvents.ALL_CHAT_TO_CLIENT, chatResponse);
    }
  }
}
