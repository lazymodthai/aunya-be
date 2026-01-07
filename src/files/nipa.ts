import { S3Client } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
dotenv.config();
export const nipaS3 = new S3Client({
  endpoint: process.env.NIPA_CLOUD_ENDPOINT,
  region: "th-bkk-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.NIPA_CLOUD_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.NIPA_CLOUD_SECRET_ACCESS_KEY ?? '',
  },
  
});
