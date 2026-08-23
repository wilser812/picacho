import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class UpdateVendorProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsIn(["KG", "UNIT", "LITER"])
  unit?: "KG" | "UNIT" | "LITER";

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsBoolean()
  isEssential?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
