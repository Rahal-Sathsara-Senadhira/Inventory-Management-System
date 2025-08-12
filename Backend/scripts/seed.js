import 'dotenv/config';
import mongoose from 'mongoose';
import Customer from '../models/customer.js';
import Item from '../models/Item.js';
import Tax from '../models/tax.js';

async function run() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  await Promise.all([
    Customer.deleteMany({}),
    Item.deleteMany({}),
    Tax.deleteMany({})
  ]);

  const [acme] = await Customer.create([
    {
      displayName: 'Acme Corp',
      customerEmail: 'info@acme.test',
      phone: '0771234567',
      currency: 'USD',
      billingAddress: { attention: 'John', addressNo: '12', street1: 'Main St', city: 'Colombo', district: 'Colombo', country: 'Sri Lanka' },
      shippingAddress: { attention: 'Warehouse', addressNo: '88', street1: 'Dock Rd', city: 'Colombo', district: 'Colombo', country: 'Sri Lanka' },
      remarks: 'Preferred customer'
    }
  ]);

  const [widgetA, serviceFee] = await Item.create([
    { name: 'Widget A', sku: 'W-A', price: 120.5, onHand: 100 },
    { name: 'Service Fee', sku: 'SRV-1', price: 0, onHand: 0 }
  ]);

  const [vat, nbt] = await Tax.create([
    { name: 'VAT', rate: 15 },
    { name: 'NBT', rate: 2 }
  ]);

  console.log('Seeded:');
  console.log({ acmeId: acme._id.toString(), itemId: widgetA._id.toString(), taxId: vat._id.toString() });

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
