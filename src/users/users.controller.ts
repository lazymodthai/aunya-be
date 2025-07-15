import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Check if the users service is running properly'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    example: { status: 'OK', message: 'Users service is running' }
  })
  async healthCheck() {
    return this.usersService.healthCheck();
  }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account with the provided information'
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User registration data'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    example: {
      message: 'User registered successfully',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data',
    example: {
      statusCode: 400,
      message: ['email must be a valid email', 'password is too weak'],
      error: 'Bad Request'
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - User already exists',
    example: {
      statusCode: 409,
      message: 'User with this email already exists',
      error: 'Conflict'
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);
    return {
      message: 'User registered successfully',
      user,
    };
  }
}