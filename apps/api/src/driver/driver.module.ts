import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DriverController } from "./driver.controller";
import { DriverOrdersController } from "./driver-orders.controller";
import { DriverService } from "./driver.service";

@Module({
  imports: [AuthModule],
  controllers: [DriverController, DriverOrdersController],
  providers: [DriverService],
})
export class DriverModule {}
