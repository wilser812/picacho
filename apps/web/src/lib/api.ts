import { createApiClient } from "@picacho/shared";

export const TOKEN_STORAGE_KEY = "picacho_token";

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null),
});

export interface ApiUser {
  userId: string;
  email: string;
  role: "BUYER" | "VENDOR" | "DRIVER" | "ADMIN";
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

export interface ApiVendor {
  id: string;
  storeName: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ApiVendorProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  unit: "KG" | "UNIT" | "LITER";
  isEssential: boolean;
  imageUrl: string | null;
  category: { name: string; slug: string };
}

export interface ApiVendorOrder {
  id: string;
  status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
  total: string;
  createdAt: string;
  buyer: { name: string; email: string };
  payment: { status: string; provider: string } | null;
  items: {
    id: string;
    quantity: string;
    unitPrice: string;
    product: { name: string; unit: ApiProduct["unit"] };
  }[];
}

export interface ApiAdminVendor {
  id: string;
  storeName: string;
  isApproved: boolean;
  createdAt: string;
  user: { name: string; email: string };
  _count: { products: number };
}

export interface ApiAdminProduct {
  id: string;
  name: string;
  price: string;
  unit: "KG" | "UNIT" | "LITER";
  isEssential: boolean;
  vendor: { storeName: string };
  category: { name: string; slug: string };
}

export interface ApiAdminOrder {
  id: string;
  status: "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";
  total: string;
  createdAt: string;
  buyer: { name: string; email: string };
  vendor: { storeName: string };
  driver: { user: { name: string } } | null;
  payment: { status: string; provider: string } | null;
}

export interface ApiAdminUser {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "VENDOR" | "DRIVER" | "ADMIN";
  createdAt: string;
}

export interface ApiPlatformSettings {
  id: string;
  commissionRate: string;
}

const UNIT_LABEL: Record<ApiProduct["unit"], string> = {
  KG: "kg",
  UNIT: "unidad",
  LITER: "L",
};

export function formatPrice(price: string, unit: ApiProduct["unit"]) {
  return `S/ ${Number(price).toFixed(2)} / ${UNIT_LABEL[unit]}`;
}
