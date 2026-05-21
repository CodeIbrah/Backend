import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('EventsGateway');
  private connectedClients = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, 'anonymous');
    this.server.emit('stats', { connected: this.connectedClients.size });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.server.emit('stats', { connected: this.connectedClients.size });
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() payload: { userId: string }) {
    this.connectedClients.set(client.id, payload.userId);
    this.logger.log(`Client ${client.id} authenticated as ${payload.userId}`);
    return { status: 'ok' };
  }

  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any): void {
    this.server.emit('message', { ...payload, sender: client.id });
  }

  emitEvent(event: string, data: any) {
    this.server.emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.connectedClients.forEach((uid, clientId) => {
      if (uid === userId) {
        this.server.to(clientId).emit(event, data);
      }
    });
  }
}
