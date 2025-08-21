// models/timeEntry.js
import mongoose from "mongoose";

const TimeEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // OPEN shift => clockOut is null until turned OFF
    clockIn:  { type: Date, required: true },
    clockOut: { type: Date, default: null }, // ⬅️ NOT required

    source:   { type: String, default: "SWITCH" }, // SWITCH/KIOSK/IMPORT
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    note:     { type: String, trim: true },
  },
  { timestamps: true }
);

// Useful indexes
TimeEntrySchema.index({ userId: 1, clockOut: 1 });
TimeEntrySchema.index({ clockIn: 1 });

// Virtual hours (uses now if still open)
TimeEntrySchema.virtual("hours").get(function () {
  if (!this.clockIn) return 0;
  const end = this.clockOut || new Date();
  const diffMs = end - this.clockIn;
  return Math.max(0, diffMs / 36e5);
});

// Prevent OverwriteModelError on reloads
const TimeEntry = mongoose.models.TimeEntry || mongoose.model("TimeEntry", TimeEntrySchema);
export default TimeEntry;
