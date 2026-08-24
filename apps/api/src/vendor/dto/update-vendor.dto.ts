import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  storeName?: string;
}
