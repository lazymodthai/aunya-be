import { POSTGRESQL } from '@/config/db-config';
import { DataSource } from 'typeorm';
import { DatabaseEntity } from './database.entity';

const dataSourceOptions = {
    type: 'postgres' as const,
    host: POSTGRESQL.host,
    port: parseInt(POSTGRESQL.port),
    username: POSTGRESQL.user,
    password: POSTGRESQL.password,
    database: POSTGRESQL.database,
    schema: POSTGRESQL.schema,
    timezone: '+07:00',
    logging: process.env.NODE_ENV === 'development' || POSTGRESQL.logging,
    debug: POSTGRESQL.debug,
    autoLoadEntities: POSTGRESQL.autoLoadEntities,
    synchronize: POSTGRESQL.synchronize, // equivalent to sequelize sync with alter: false
    entities: DatabaseEntity,
    migrations: ['/entities/*.ts'],
    migrationsTableName: 'migrations',
    extra: {
        max: POSTGRESQL.pool.max,
        min: POSTGRESQL.pool.min,
        idleTimeoutMillis: POSTGRESQL.pool.idleTimeoutMillis,
        connectionTimeoutMillis: POSTGRESQL.pool.connectionTimeoutMillis,
    },
};

const dataSource = new DataSource(dataSourceOptions);

// Initialize the data source
export const initializeDataSource = async () => {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();

        // รัน pending migrations อัตโนมัติ
        if (process.env.NODE_ENV === 'development') {
            const pendingMigrations = await dataSource.showMigrations();
            if (pendingMigrations) {
                console.log('🔄 Running pending migrations...');
                await dataSource.runMigrations();
                console.log('✅ Migrations completed');
            }
        } else {
            console.log('🔧 Development mode: Using synchronize');
        }
    }
    return dataSource;
};

// Database providers for dependency injection
const databaseProviders = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async () => {
            return await initializeDataSource();
        },
    },
];

// Repository provider factory
const createRepositoryProvider = (token: string, entity: any) => ({
    provide: token,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
    inject: ['DATA_SOURCE'],
});

// Alternative: Using TypeORM Module (recommended approach)
const typeOrmConfig = {
    ...dataSourceOptions, // This already includes entities
    autoLoadEntities: true, // automatically load entities
};

export {
    dataSource,
    databaseProviders,
    createRepositoryProvider,
    typeOrmConfig
};