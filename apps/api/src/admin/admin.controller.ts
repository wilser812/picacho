import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { AdminService } from "./admin.service";
import { UpdateVendorApprovalDto } from "./dto/update-vendor-approval.dto";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { AssignDriverDto } from "./dto/assign-driver.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("vendors")
  listVendors() {
    return this.admin.listVendors();
  }

  @Patch("vendors/:id/approval")
  setVendorApproval(@Param("id") id: string, @Body() dto: UpdateVendorApprovalDto) {
    return this.admin.setVendorApproval(id, dto.isApproved);
  }

  @Get("products")
  listProducts() {
    return this.admin.listProducts();
  }

  @Delete("products/:id")
  deleteProduct(@Param("id") id: string) {
    return this.admin.deleteProduct(id);
  }

  @Get("orders")
  listOrders() {
    return this.admin.listOrders();
  }

  @Get("drivers")
  listDrivers() {
    return this.admin.listDrivers();
  }

  @Patch("orders/:id/assign-driver")
  assignDriver(@Param("id") id: string, @Body() dto: AssignDriverDto) {
    return this.admin.assignDriver(id, dto.driverId);
  }

  @Get("users")
  listUsers() {
    return this.admin.listUsers();
  }

  @Get("settings")
  getSettings() {
    return this.admin.getSettings();
  }

  @Patch("settings")
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.admin.updateSettings(dto.commissionRate);
  }
}
