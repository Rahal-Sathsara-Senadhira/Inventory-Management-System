// models/timeEntry.js
import mongoose from "mongoose";

const TimeEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date, required: true },
    // optional metadata
    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Quick virtual: duration in hours (float)
TimeEntrySchema.virtual("hours").get(function () {
  if (!this.clockIn || !this.clockOut) return 0;
  const diffMs = this.clockOut - this.clockIn;
  return Math.max(0, diffMs / 36e5); // 1000*60*60
});

const TimeEntry = mongoose.models.TimeEntry || mongoose.model("TimeEntry", TimeEntrySchema);
export default TimeEntry;
