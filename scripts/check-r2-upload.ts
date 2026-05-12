import 'dotenv/config';
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../src/config/r2.client';
import { storageConfig, validateStorageConfig } from '../src/config/storage.config';

const key = `_r2-healthcheck/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const metadata = (error as { $metadata?: { httpStatusCode?: number; requestId?: string } }).$metadata;
  const details = [
    `${error.name}: ${error.message}`,
    metadata?.httpStatusCode ? `HTTP status: ${metadata.httpStatusCode}` : undefined,
    metadata?.requestId ? `Request ID: ${metadata.requestId}` : undefined,
  ];

  return details.filter(Boolean).join('\n');
}

async function main(): Promise<void> {
  validateStorageConfig();

  console.log('Checking R2 upload credentials...');
  console.log(`Endpoint: https://${storageConfig.accountId}.r2.cloudflarestorage.com`);
  console.log(`Bucket: ${storageConfig.publicBucket}`);
  console.log(`Object: ${key}`);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: storageConfig.publicBucket,
      Key: key,
      Body: 'penguin-r2-healthcheck',
      ContentType: 'text/plain',
    }),
  );

  await r2Client.send(
    new HeadObjectCommand({
      Bucket: storageConfig.publicBucket,
      Key: key,
    }),
  );

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: storageConfig.publicBucket,
      Key: key,
    }),
  );

  console.log('R2 upload check passed.');
}

main().catch((error) => {
  console.error('R2 upload check failed.');
  console.error(describeError(error));
  process.exit(1);
});
