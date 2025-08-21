// models/timeEvent.js
import mongoose from "mongoose";
import crypto from "crypto";

const TimeEventSchema = new mongoose.Schema(
  {
    subjectUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorUserId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entryId:       { type: mongoose.Schema.Types.ObjectId, ref: "TimeEntry" }, // linked shift if any

    ts:            { type: Date, default: () => new Date(), index: true },
    event:         { type: String, enum: ["ON","OFF","NOOP_ON","NOOP_OFF","ADMIN_CLOSE"], required: true, index: true },
    source:        { type: String, default: "SWITCH" }, // SWITCH/KIOSK/IMPORT

    ip:            { type: String },
    userAgent:     { type: String },
    note:          { type: String },

    // Tamper-evident chain per employee
    previousHash:  { type: String },
    hash:          { type: String, index: true },
  },
  { timestamps: true }
);

// Compute hash chain per subjectUserId (append-only)
TimeEventSchema.pre("save", async function (next) {
  if (this.hash) return next();
  try {
    const prev = await this.constructor
      .findOne({ subjectUserId: this.subjectUserId })
      .sort({ ts: -1, _id: -1 })
      .select("hash");
    this.previousHash = prev?.hash || "";
    const plaintext = [
      String(this.subjectUserId || ""),
      String(this.actorUserId || ""),
      String(this.entryId || ""),
      this.ts?.toISOString() || "",
      this.event || "",
      this.source || "",
      this.ip || "",
      this.userAgent || "",
      this.previousHash || "",
      this.note || "",
    ].join("|");
    this.hash = crypto.createHash("sha256").update(plaintext).digest("hex");
    next();
  } catch (e) {
    next(e);
  }
});

const TimeEvent = mongoose.models.TimeEvent || mongoose.model("TimeEvent", TimeEventSchema);
export default TimeEvent;
