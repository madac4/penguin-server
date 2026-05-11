import 'dotenv/config';
import app from './app';
import { connectDatabase } from './database/connection';

const PORT = Number(process.env.PORT ?? 4000);

async function start(): Promise<void> {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`\n🐧 Penguin CMS API`);
    console.log(`   ├─ API      →  http://localhost:${PORT}/api/v1`);
    console.log(`   ├─ Docs     →  http://localhost:${PORT}/docs`);
    console.log(`   ├─ OpenAPI  →  http://localhost:${PORT}/openapi.json`);
    console.log(`   └─ Health   →  http://localhost:${PORT}/api/v1/health\n`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
