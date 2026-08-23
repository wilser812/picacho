import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { VendorService } from "./vendor.service";
import { CreateVendorProductDto } from "./dto/create-vendor-product.dto";
import { UpdateVendorProductDto } from "./dto/update-vendor-product.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("VENDOR")
@Controller("vendor/products")
export class VendorProductsController {
  constructor(private vendor: VendorService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.vendor.listMyProducts(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVendorProductDto) {
    return this.vendor.createProduct(user.userId, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateVendorProductDto,
  ) {
    return this.vendor.updateProduct(user.userId, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.vendor.deleteProduct(user.userId, id);
  }
}
