import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateVendorProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsIn(["KG", "UNIT", "LITER"])
  unit!: "KG" | "UNIT" | "LITER";

  @IsString()
  categorySlug!: string;

  @IsOptional()
  @IsBoolean()
  isEssential?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
