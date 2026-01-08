import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ObjectStorageModule } from './object-storage/object-storage.module';
import { UploadedFileModule } from './uploaded-files/uploaded-file.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { PricesModule } from './prices/prices.module';
import { LoggerMiddleware } from '@/middlewares/logger.middleware';
import { FilesModule } from './files/files.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available globally
      envFilePath: path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        name: "default",
        type: 'postgres' as const,
        host: configService.get<string>("DB_HOST") || 'localhost',
        port: configService.get<number>("DB_PORT") || 5432,
        username: configService.get<string>("DB_USERNAME") || 'postgres',
        password: configService.get<string>("DB_PASSWORD") || '',
        database: configService.get<string>("DB_NAME") || '',
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        autoLoadEntities: true,
        synchronize:  true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ObjectStorageModule,
    UploadedFileModule,
    BookingModule,
    PricesModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
