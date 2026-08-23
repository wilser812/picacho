import { IsIn } from "class-validator";

export class UpdateOrderStatusDto {
  @IsIn(["PREPARING"])
  status!: "PREPARING";
}
