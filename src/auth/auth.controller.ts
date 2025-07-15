import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health Check', 
    description: 'Check the status of Auth Service' 
  })
  @ApiOkResponse({
    description: 'Health check successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  async healthCheck() {
    return this.authService.healthCheck();
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User Login', 
    description: 'Authenticate user with email and password' 
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'Login credentials'
  })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      ...result,
    };
  }

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get User Profile', 
    description: 'Retrieve profile information of authenticated user' 
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Profile retrieved successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            iat: { type: 'number', example: 1640995200 },
            exp: { type: 'number', example: 1641081600 }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  getProfile(@Request() req) {
    return {
      message: 'Profile retrieved successfully',
      user: req.user,
    };
  }
}