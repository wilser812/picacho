import { io, type Socket } from "socket.io-client";
import type { DriverLocationUpdateInput } from "@picacho/shared";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");
  return socket;
}

export function joinOrderRoom(orderId: string) {
  getSocket().emit("order:join", orderId);
}

export function sendDriverLocation(payload: DriverLocationUpdateInput) {
  getSocket().emit("driver:location", payload);
}
