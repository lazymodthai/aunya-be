import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}


  async healthCheck(): Promise<string> {
    return 'Users service is up and running!';
  }
  
  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, firstName, lastName, phoneNumber } = registerDto;

    try {
      // ตรวจสอบว่า email ซ้ำหรือไม่
      const existingUser = await this.usersRepository.findOne({ 
        where: { email } 
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // เข้ารหัสรหัสผ่าน
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // สร้าง user ใหม่
      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber
      });

      // บันทึกลงฐานข้อมูล
      const savedUser = await this.usersRepository.save(user);

      // ลบ password ออกจาก response
      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as User;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong during registration');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
