import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApiClient } from "@picacho/shared";

const TOKEN_KEY = "picacho_token";
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

export interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: "KG" | "UNIT" | "LITER";
  isEssential: boolean;
  imageUrl: string | null;
  vendor: { storeName: string };
  category: { name: string; slug: string };
}

export interface ApiOrder {
  id: string;
  status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
  total: string;
  createdAt: string;
  vendor: { storeName: string };
  driver: {
    id: string;
    phone: string;
    vehiclePlate: string;
    vehicleType: string;
    user: { name: string };
  } | null;
  payment: { status: string; provider: string } | null;
  items: {
    id: string;
    quantity: string;
    unitPrice: string;
    product: { name: string; unit: ApiProduct["unit"] };
  }[];
}

export interface ApiDriverLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

const UNIT_LABEL: Record<ApiProduct["unit"], string> = {
  KG: "kg",
  UNIT: "unidad",
  LITER: "L",
};

export function formatPrice(price: string, unit: ApiProduct["unit"]) {
  return `S/ ${Number(price).toFixed(2)} / ${UNIT_LABEL[unit]}`;
}
