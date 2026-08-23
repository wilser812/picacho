import { IsString, MinLength } from "class-validator";

export class RegisterVendorDto {
  @IsString()
  @MinLength(2)
  storeName!: string;
}
