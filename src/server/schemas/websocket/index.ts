// types.ts
import * as ws from "ws";

export interface UserSubscription {
  socket: ws.WebSocket;
  requestId: string;
}

export const subscriptionsData: UserSubscription[] = [];
