import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UploadedFileModule } from './uploaded-files/uploaded-file.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { PricesModule } from './prices/prices.module';
import { LoggerMiddleware } from '@/middlewares/logger.middleware';
import { FilesModule } from './files/files.module';
import { CheckSlipModule } from './check-slip/check-slip.module';
import { SettingsModule } from './settings/settings.module';
import { TasksModule } from './tasks/tasks.module';
import { GalleryModule } from './gallery/gallery.module';
import { PropertyInfoModule } from './property-info/property-info.module';
import { VisitorModule } from './visitor/visitor.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available globally
      envFilePath: path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
    }),
    ScheduleModule.forRoot(),
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
    AuthModule,
    UploadedFileModule,
    BookingModule,
    PricesModule,
    FilesModule,
    CheckSlipModule,
    SettingsModule,
    TasksModule,
    GalleryModule,
    PropertyInfoModule,
    VisitorModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
