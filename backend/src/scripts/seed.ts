import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db";
import { Employee } from "../models/Employee";
import { nextEmployeeId } from "../models/Counter";
import mongoose from "mongoose";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  await connectDB(uri);

  const email = process.env.SEED_ADMIN_EMAIL || "admin@ems.local";
  const existing = await Employee.findOne({ email });
  if (existing) {
    console.log(`Super Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const employeeId = await nextEmployeeId();
  await Employee.create({
    employeeId,
    name: process.env.SEED_ADMIN_NAME || "Super Admin",
    email,
    phone: "9999999999",
    department: "Administration",
    designation: "General Manager",
    salary: 100000,
    joiningDate: new Date(),
    status: "active",
    role: "super_admin",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
  });

  console.log(`Seeded Super Admin: ${email} / ${process.env.SEED_ADMIN_PASSWORD || "Admin@12345"}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
