import { Body, Controller, Get, Header, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("checkout/:orderId")
  createCheckout(@CurrentUser() user: AuthenticatedUser, @Param("orderId") orderId: string) {
    return this.payments.createCheckout(orderId, user.userId);
  }

  @Post("webhook")
  webhook(@Query() query: Record<string, string>, @Body() body: Record<string, unknown>) {
    return this.payments.handleWebhook(query, body);
  }

  @Get("mock-checkout/:orderId")
  @Header("Content-Type", "text/html; charset=utf-8")
  mockCheckout(@Param("orderId") orderId: string) {
    return this.payments.approveMock(orderId);
  }
}
