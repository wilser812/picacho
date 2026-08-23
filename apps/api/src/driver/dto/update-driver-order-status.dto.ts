import { IsIn } from "class-validator";

export class UpdateDriverOrderStatusDto {
  @IsIn(["ON_THE_WAY", "DELIVERED"])
  status!: "ON_THE_WAY" | "DELIVERED";
}
