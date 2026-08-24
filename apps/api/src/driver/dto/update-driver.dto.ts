import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  vehicleType?: string;
}
