import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { VendorController } from "./vendor.controller";
import { VendorProductsController } from "./vendor-products.controller";
import { VendorOrdersController } from "./vendor-orders.controller";
import { VendorService } from "./vendor.service";

@Module({
  imports: [AuthModule],
  controllers: [VendorController, VendorProductsController, VendorOrdersController],
  providers: [VendorService],
})
export class VendorModule {}
