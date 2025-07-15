import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async healthCheck(): Promise<string> {
    return 'Auth service is up and running!';
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const access_token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: number): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Helper method สำหรับสร้าง JWT token
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return this.jwtService.sign(payload);
  }

  // Helper method สำหรับ return user data
  private formatUserResponse(user: any): { access_token: string; user: any } {
    const access_token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async facebookLogin(req: any): Promise<{ access_token: string; user: any }> {
    if (!req.user) {
      throw new UnauthorizedException('No user from facebook');
    }

    const { email, firstName, lastName } = req.user;

    if (!email) {
      throw new UnauthorizedException('Email is required from Facebook');
    }

    // ตรวจสอบว่า user มีอยู่แล้วหรือไม่
    let user = await this.usersService.findByEmail(email);

    if (user) {
      // ตรวจสอบว่า account active หรือไม่
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      return this.formatUserResponse(user);
    }

    // สร้าง user ใหม่สำหรับ Facebook login
    // ใช้ random password ที่ hash แล้ว เพื่อความปลอดภัย
    const randomPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await this.usersService.register({
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      password: 'facebook_login', // This password will be hashed by the register service
    });

    return this.formatUserResponse(newUser);
  }
}