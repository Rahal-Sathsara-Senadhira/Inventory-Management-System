// scripts/seedUsers.js
import "dotenv/config";
import mongoose from "mongoose";
import User, { ROLES } from "../models/user.js";

async function upsertUser({ name, email, role, password }) {
  const lower = String(email).toLowerCase();
  const exists = await User.findOne({ email: lower });
  if (exists) {
    console.log("✔ exists:", lower, "role=", exists.role);
    return false;
  }
  const passwordHash = await User.hashPassword(password);
  await User.create({
    name,
    email: lower,
    role,
    passwordHash,
    mustChangePassword: true, // force password change on first login
  });
  console.log("➕ created:", lower, "/", password);
  return true;
}

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ Missing MONGODB_URI or MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const users = [
    {
      name: "Alice Admin",
      email: process.env.SEED_ADMIN_EMAIL || "admin@demo.com",
      role: ROLES.ADMIN,
      password: process.env.SEED_ADMIN_PASSWORD || "Admin@123",
    },
    {
      name: "Mason Manager",
      email: "manager@demo.com",
      role: ROLES.MANAGER,
      password: "Manager@123",
    },
    {
      name: "Ivy Inventory",
      email: "inventory@demo.com",
      role: ROLES.INVENTORY,
      password: "Inventory@123",
    },
    {
      name: "Sam Sales",
      email: "sales@demo.com",
      role: ROLES.SALES,
      password: "Sales@123",
    },
  ];

  let created = 0;
  for (const u of users) {
    const c = await upsertUser(u);
    if (c) created++;
  }

  await mongoose.disconnect();
  console.log(`\nDone. New users created: ${created}.`);
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
