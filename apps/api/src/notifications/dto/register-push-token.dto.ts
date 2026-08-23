import { IsString, MinLength } from "class-validator";

export class RegisterPushTokenDto {
  @IsString()
  @MinLength(5)
  token!: string;
}
