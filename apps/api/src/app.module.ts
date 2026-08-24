import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { TrackingModule } from "./tracking/tracking.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { InvoicingModule } from "./invoicing/invoicing.module";
import { VendorModule } from "./vendor/vendor.module";
import { DriverModule } from "./driver/driver.module";
import { AdminModule } from "./admin/admin.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    TrackingModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    InvoicingModule,
    VendorModule,
    DriverModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
