export const storageConfig = {
  accountId: process.env.R2_ACCOUNT_ID ?? '',
  accessKey: process.env.R2_ACCESS_KEY ?? '',
  secretKey: process.env.R2_SECRET_KEY ?? '',
  bucket: process.env.R2_BUCKET ?? 'penguin-develop',
  publicUrl: process.env.R2_PUBLIC_URL ?? '',
}
