import { IsBoolean } from "class-validator";

export class UpdateVendorApprovalDto {
  @IsBoolean()
  isApproved!: boolean;
}
