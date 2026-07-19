import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, DEPARTMENTS, STATUSES, Role, Department, Status } from "../constants";

export interface EmployeeDoc extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: Status;
  role: Role;
  reportingManager: Types.ObjectId | null;
  profileImage: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const employeeSchema = new Schema<EmployeeDoc>(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    department: { type: String, required: true, enum: DEPARTMENTS },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    status: { type: String, required: true, enum: STATUSES, default: "active" },
    role: { type: String, required: true, enum: ROLES, default: "employee" },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    profileImage: { type: String, default: null },
    password: { type: String, required: true, select: false, minlength: 8 },
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

employeeSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const Employee = model<EmployeeDoc>("Employee", employeeSchema);
