import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.orders.createFromCart(user.userId, dto.items);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.listForBuyer(user.userId);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.orders.getById(id, user.userId);
  }

  @Get(":id/driver-location")
  getDriverLocation(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.orders.getDriverLocation(id, user.userId);
  }
}
