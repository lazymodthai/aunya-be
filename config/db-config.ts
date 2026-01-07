import * as dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const DB_CONN_LIMIT = Number(process.env.DB_CONN_LIMIT ?? 47);   // ใส่ 47 เป็นค่า default
const APP_INSTANCES = Number(process.env.APP_INSTANCES ?? 1);    // จำนวน instance ของแอป
const RESERVED = Number(process.env.DB_CONN_RESERVED ?? 10);     // กันไว้ให้ระบบ/เครื่องมือ
const AVAILABLE = Math.max(5, DB_CONN_LIMIT - RESERVED);
const POOL_MAX_DEFAULT = Math.max(2, Math.min(15, Math.floor(AVAILABLE / APP_INSTANCES)));

const POSTGRESQL = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: process.env.DB_SCHEMA,
  debug: process.env.DB_DEBUG === 'true',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  autoLoadEntities: process.env.DB_AUTO_LOAD_ENTITIES === 'true',
  pool: {
    max: Number(process.env.DB_POOL_MAX ?? POOL_MAX_DEFAULT),
    min: Number(process.env.DB_POOL_MIN ?? 2),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE ?? 30000),
    connectionTimeoutMillis: Number(process.env.DB_POOL_TIMEOUT ?? 5000),
  },
}

export { POSTGRESQL }