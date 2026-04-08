import { S3Client } from '@aws-sdk/client-s3'
import { storageConfig } from './storage.config'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${storageConfig.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: storageConfig.accessKey,
    secretAccessKey: storageConfig.secretKey,
  },
})
