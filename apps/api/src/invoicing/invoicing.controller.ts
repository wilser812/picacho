import { Controller, Get, Header, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { InvoicingService } from "./invoicing.service";

@Controller("invoicing")
export class InvoicingController {
  constructor(private invoicing: InvoicingService) {}

  @UseGuards(JwtAuthGuard)
  @Get("order/:orderId")
  getForOrder(@CurrentUser() user: AuthenticatedUser, @Param("orderId") orderId: string) {
    return this.invoicing.getForOrder(orderId, user.userId);
  }

  @Get("mock/:orderId")
  @Header("Content-Type", "text/html; charset=utf-8")
  mockView(@Param("orderId") orderId: string) {
    return this.invoicing.renderMockHtml(orderId);
  }
}
