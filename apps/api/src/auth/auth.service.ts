import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("El correo ya está registrado");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash, role: "BUYER" },
    });

    return this.buildToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Credenciales inválidas");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Credenciales inválidas");

    return this.buildToken(user.id, user.email, user.role);
  }

  private buildToken(userId: string, email: string, role: string) {
    const accessToken = this.jwt.sign({ sub: userId, email, role });
    return { accessToken, user: { userId, email, role } };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        vendor: { select: { storeName: true, isApproved: true } },
        driver: { select: { phone: true, vehiclePlate: true, vehicleType: true, isAvailable: true } },
      },
    });
    return { userId: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt, vendor: user.vendor, driver: user.driver };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) throw new ConflictException("El correo ya está en uso");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email: dto.email },
    });

    return this.getProfile(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Contraseña actual incorrecta");

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { updated: true };
  }
}
