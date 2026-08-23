import { IsString, MinLength } from "class-validator";

export class RegisterDriverDto {
  @IsString()
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(3)
  vehiclePlate!: string;

  @IsString()
  @MinLength(2)
  vehicleType!: string;
}
