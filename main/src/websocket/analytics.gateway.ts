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
import { ConfigService } from '@nestjs/config';

export interface AnalyticsEvent {
  channel: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

@WebSocketGateway({
  namespace: 'analytics',
  cors: {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      cb(null, true);
    },
    credentials: true,
  },
  serveClient: false,
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- NestJS injects via decorator
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger('AnalyticsGateway');
  private connectedClients = new Map<string, string>();
  private roomSubscriptions = new Map<string, Set<string>>();

  constructor(private readonly configService: ConfigService) {
    const port = this.configService.get<number>('PORT', 3000);
    this.logger.log(`Analytics WebSocket ready on port ${port}/analytics`);
  }

  handleConnection(client: Socket): void {
    this.connectedClients.set(client.id, 'anonymous');
    this.logger.log(`Client connected: ${client.id} (total: ${this.connectedClients.size})`);
    client.emit('connected', { clientId: client.id, connected: this.connectedClients.size });
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.roomSubscriptions.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (total: ${this.connectedClients.size})`);
    this.server.emit('stats', { connected: this.connectedClients.size });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channels: string | string[] },
  ): { status: string; channels: string[] } {
    const channels = Array.isArray(payload.channels) ? payload.channels : [payload.channels];

    if (!this.roomSubscriptions.has(client.id)) {
      this.roomSubscriptions.set(client.id, new Set());
    }

    let subs = this.roomSubscriptions.get(client.id);
    if (!subs) {
      subs = new Set();
      this.roomSubscriptions.set(client.id, subs);
    }
    for (const ch of channels) {
      subs.add(ch);
      void client.join(`analytics:${ch}`);
    }

    this.logger.log(`Client ${client.id} subscribed to: ${channels.join(', ')}`);
    return { status: 'ok', channels };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channels: string | string[] },
  ): { status: string; channels: string[] } {
    const channels = Array.isArray(payload.channels) ? payload.channels : [payload.channels];

    const subs = this.roomSubscriptions.get(client.id);
    if (subs) {
      for (const ch of channels) {
        subs.delete(ch);
        void client.leave(`analytics:${ch}`);
      }
    }

    this.logger.log(`Client ${client.id} unsubscribed from: ${channels.join(', ')}`);
    return { status: 'ok', channels };
  }

  @SubscribeMessage('ping')
  handlePing(): { status: string; time: number } {
    return { status: 'pong', time: Date.now() };
  }

  /**
   * Broadcast an analytics event to all subscribers of the channel.
   * Channel naming convention: "metrics", "errors", "events", "performance", "custom:*"
   */
  broadcast(channel: string, event: string, data: Record<string, unknown>): void {
    this.server.to(`analytics:${channel}`).emit(event, {
      ...data,
      _meta: { channel, timestamp: new Date().toISOString() },
    });
  }

  /**
   * Broadcast to all connected clients (not channel-specific).
   */
  broadcastAll(event: string, data: Record<string, unknown>): void {
    this.server.emit(event, {
      ...data,
      _meta: { timestamp: new Date().toISOString() },
    });
  }
}
