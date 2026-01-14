import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@/entities/users.entity';
import { SessionEntity } from '@/entities/session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async healthCheck(): Promise<string> {
    return 'Auth service is up and running!';
  }

  async register(registerDto: RegisterDto): Promise<UserEntity> {
    const { email, password, firstName, lastName, phoneNumber } = registerDto;

    try {
      const existingUser = await this.usersRepository.findOne({
        where: { email }
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber
      });

      const savedUser = await this.usersRepository.save(user);

      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as UserEntity;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong during registration');
    }
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    const { email, password } = loginDto;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.findByEmail(email);
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

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refresh_token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = this.sessionsRepository.create({
      userId: user.id,
      refreshTokenHash: this.hashToken(refresh_token),
      userAgent,
      ipAddress,
      expiresAt,
    });
    await this.sessionsRepository.save(session);

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const decoded = this.jwtService.verify(refreshToken);

      // Find valid session
      const tokenHash = this.hashToken(refreshToken);
      const session = await this.sessionsRepository.findOne({
        where: {
          refreshTokenHash: tokenHash,
          isRevoked: false,
        },
      });

      if (!session) {
        throw new UnauthorizedException('Session not found or revoked');
      }

      if (new Date() > session.expiresAt) {
        await this.sessionsRepository.update(session.id, { isRevoked: true });
        throw new UnauthorizedException('Session expired');
      }

      const user = await this.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
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

      const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
      const new_refresh_token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' });

      // Update session with new refresh token (token rotation)
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await this.sessionsRepository.update(session.id, {
        refreshTokenHash: this.hashToken(new_refresh_token),
        userAgent,
        ipAddress,
        expiresAt: newExpiresAt,
      });

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = this.hashToken(refreshToken);
    await this.sessionsRepository.update(
      { refreshTokenHash: tokenHash },
      { isRevoked: true },
    );
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionsRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async getActiveSessions(userId: string): Promise<SessionEntity[]> {
    return this.sessionsRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
