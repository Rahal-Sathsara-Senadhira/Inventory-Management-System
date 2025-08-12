import "dotenv/config";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Salesperson from "../models/salesPerson.js";

const tenantId = "demo-tenant";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Salesperson.deleteMany({ tenantId });

  await Salesperson.create([
    { uid: uuidv4(), tenantId, name: "Saman Perera", email: "saman@example.com", phone: "0771234567", employeeCode: "SP-001", commissionRate: 2 },
    { uid: uuidv4(), tenantId, name: "Nimali Jayasuriya", email: "nimali@example.com", phone: "0789876543", employeeCode: "NJ-002", commissionRate: 1.5 }
  ]);

  console.log("Seeded salespersons ✅");
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
