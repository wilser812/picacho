export type UserRole = "BUYER" | "VENDOR" | "DRIVER" | "ADMIN";
export type ProductUnit = "KG" | "UNIT" | "LITER";
export type OrderStatus = "RECEIVED" | "PREPARING" | "ON_THE_WAY" | "DELIVERED";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  parentId?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit: ProductUnit;
  categoryId: string;
  vendorId: string;
  isEssential: boolean;
  imageUrl?: string | null;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  vendorId: string;
  status: OrderStatus;
  driver?: DriverInfo | null;
  total: number;
  createdAt: string;
}
