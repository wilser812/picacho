import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/current-user.decorator";
import { DriverService } from "./driver.service";
import { RegisterDriverDto } from "./dto/register-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";

@UseGuards(JwtAuthGuard)
@Controller("driver")
export class DriverController {
  constructor(private driver: DriverService) {}

  @Post("register")
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDriverDto) {
    return this.driver.registerDriver(user.userId, dto);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.driver.getMyDriverProfile(user.userId);
  }

  @Patch("me")
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateDriverDto) {
    return this.driver.updateDriver(user.userId, dto);
  }
}
