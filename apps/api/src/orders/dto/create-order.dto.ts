import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsPositive, IsString, ValidateNested } from "class-validator";

export class CartItemDto {
  @IsString()
  productId!: string;

  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
