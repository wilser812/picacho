import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { DriverService } from "./driver.service";
import { UpdateDriverOrderStatusDto } from "./dto/update-driver-order-status.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("DRIVER")
@Controller("driver/orders")
export class DriverOrdersController {
  constructor(private driver: DriverService) {}

  @Get("available")
  available() {
    return this.driver.listAvailableOrders();
  }

  @Post(":id/accept")
  accept(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.driver.acceptOrder(user.userId, id);
  }

  @Get()
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.driver.listMyOrders(user.userId);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateDriverOrderStatusDto,
  ) {
    return this.driver.updateOrderStatus(user.userId, id, dto.status);
  }
}
