import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2),
});

export const productSearchSchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc"]).default("price_asc"),
});

export const driverLocationUpdateSchema = z.object({
  orderId: z.string(),
  driverId: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type DriverLocationUpdateInput = z.infer<typeof driverLocationUpdateSchema>;
