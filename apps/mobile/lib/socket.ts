import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) socket = io(API_URL);
  return socket;
}

export function joinOrderRoom(orderId: string) {
  getSocket().emit("order:join", orderId);
}
