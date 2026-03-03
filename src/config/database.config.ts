export const databaseConfig = {
  uri: process.env.DATABASE_URL ?? 'mongodb://localhost:27017/penguin_db',
  options: {
    maxPoolSize: 10,
  },
};
