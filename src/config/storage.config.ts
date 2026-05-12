function readStorageEnv(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

export const storageConfig = {
  accountId: readStorageEnv('R2_ACCOUNT_ID'),
  accessKey: readStorageEnv('R2_ACCESS_KEY'),
  secretKey: readStorageEnv('R2_SECRET_KEY'),
  publicBucket: readStorageEnv('R2_PUBLIC_BUCKET'),
  privateBucket: readStorageEnv('R2_PRIVATE_BUCKET'),
  publicUrl: readStorageEnv('R2_PUBLIC_URL').replace(/\/+$/, ''),
};

export function validateStorageConfig(options: { requirePublicUrl?: boolean } = {}): void {
  const missing = [
    ['R2_ACCOUNT_ID', storageConfig.accountId],
    ['R2_ACCESS_KEY', storageConfig.accessKey],
    ['R2_SECRET_KEY', storageConfig.secretKey],
    ['R2_PUBLIC_BUCKET', storageConfig.publicBucket],
    ['R2_PRIVATE_BUCKET', storageConfig.privateBucket],
    ...(options.requirePublicUrl ? [['R2_PUBLIC_URL', storageConfig.publicUrl]] : []),
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required storage environment variables: ${missing.join(', ')}`);
  }
}
