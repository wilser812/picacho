import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { NotificationsService } from "./notifications.service";
import { RegisterPushTokenDto } from "./dto/register-push-token.dto";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Post("register-token")
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterPushTokenDto) {
    return this.notifications.registerToken(user.userId, dto.token);
  }
}
