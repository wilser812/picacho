import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApiClient } from "@picacho/shared";

const TOKEN_KEY = "picacho_driver_token";
let cachedToken: string | null = null;

export async function loadToken() {
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function saveToken(token: string) {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: () => cachedToken,
});

export interface ApiUser {
  userId: string;
  email: string;
  role: "BUYER" | "VENDOR" | "DRIVER" | "ADMIN";
}

export interface ApiDriverProfile {
  id: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  isAvailable: boolean;
}

export interface ApiDriverOrder {
  id: string;
  status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
  total: string;
  createdAt: string;
  vendor: { storeName: string };
  buyer: { name: string };
  items: {
    id: string;
    quantity: string;
    product: { name: string; unit: "KG" | "UNIT" | "LITER" };
  }[];
}
