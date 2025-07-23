import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { UploadedFileModule } from './uploaded-files/uploaded-file.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available globally
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as any,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for development
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ObjectStorageModule,
    UploadedFileModule,
    BookingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
