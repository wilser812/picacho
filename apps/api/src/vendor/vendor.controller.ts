import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { VendorService } from "./vendor.service";
import { RegisterVendorDto } from "./dto/register-vendor.dto";

@UseGuards(JwtAuthGuard)
@Controller("vendor")
export class VendorController {
  constructor(private vendor: VendorService) {}

  @Post("register")
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterVendorDto) {
    return this.vendor.registerVendor(user.userId, dto.storeName);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.vendor.getMyVendor(user.userId);
  }
}
