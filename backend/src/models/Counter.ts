import { Schema, model } from "mongoose";

interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = model<CounterDoc>("Counter", counterSchema);

export async function nextEmployeeId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "employeeId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `EMP${String(counter.seq).padStart(4, "0")}`;
}
