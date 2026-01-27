import * as dotenv from 'dotenv'

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const APP = {
  port: process.env.APP_PORT || 3005,
  title: process.env.APP_TITLE || ``,
  description: process.env.APP_DESCRIPTION || ``,
  version: process.env.APP_VERSION || `1.0.0`,
  domain: process.env.APP_DOMAIN || `1.0.0`,

  // SECRET_KEY
  secretKeyJwt: process.env.JWT_SECRET || ``,
}

const NIPA_CLOUD = {
  endpoint: process.env.NIPA_CLOUD_ENDPOINT || '',
  bucketName: process.env.NIPA_CLOUD_BUCKET_NAME || '',
  accessKeyId: process.env.NIPA_CLOUD_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.NIPA_CLOUD_SECRET_ACCESS_KEY || '',
}

const DB = {
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  name: process.env.DB_NAME || '',
}

const BOT_API = {
  url: process.env.BOT_API_URL || '',
  token: process.env.BOT_API_TOKEN || '',
}

const SLIP_VERIFICATION_API = {
  url: process.env.SLIP_VERIFICATION_API_URL || '',
  urlGenerate: process.env.SLIP_GENERATE_FILE || '',
  secretKey: process.env.SLIP_VERIFICATION_SECRET_KEY || '',

}

export { APP, NIPA_CLOUD, DB, BOT_API, SLIP_VERIFICATION_API }
