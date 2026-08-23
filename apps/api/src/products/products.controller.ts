import { Controller, Get, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  list(
    @Query("categorySlug") categorySlug?: string,
    @Query("essential") essential?: string,
    @Query("sort") sort?: "price_asc" | "price_desc",
  ) {
    return this.products.list({ categorySlug, essential: essential === "true", sort });
  }

  @Get("search")
  search(@Query("q") q: string, @Query("sort") sort?: "price_asc" | "price_desc") {
    return this.products.search(q, sort);
  }
}
