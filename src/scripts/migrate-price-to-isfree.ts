import 'dotenv/config';
import mongoose from 'mongoose';
import { databaseConfig } from '../config/database.config';

async function main() {
  await mongoose.connect(databaseConfig.uri, databaseConfig.options);

  const Product = mongoose.connection.collection('products');

  const freed = await Product.updateMany({ price: 0 }, { $set: { isFree: true } });
  const paid = await Product.updateMany(
    { price: { $gt: 0 } },
    { $set: { isFree: false } },
  );
  const stripped = await Product.updateMany({}, { $unset: { price: '' } });

  console.log(`isFree=true: ${freed.modifiedCount}`);
  console.log(`isFree=false: ${paid.modifiedCount}`);
  console.log(`price unset: ${stripped.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
