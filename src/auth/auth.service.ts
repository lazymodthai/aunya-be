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
  ) {}

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
      isAdmin: user.isAdmin,
    };

    const access_token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
