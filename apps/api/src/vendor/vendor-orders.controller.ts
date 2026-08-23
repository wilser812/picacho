import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { VendorService } from "./vendor.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("VENDOR")
@Controller("vendor/orders")
export class VendorOrdersController {
  constructor(private vendor: VendorService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.vendor.listMyOrders(user.userId);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.vendor.updateOrderStatus(user.userId, id, dto.status);
  }
}
