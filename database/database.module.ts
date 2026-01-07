import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './database.providers';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () => typeOrmConfig,
        }),
    ],
})
export class DatabaseModule { }
