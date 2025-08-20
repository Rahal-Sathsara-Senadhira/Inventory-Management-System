// models/user.js
import mongoose from "mongoose";
import bcrypt from "bcrypt"; // ⬅️ now using native bcrypt

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  INVENTORY: "INVENTORY",
  SALES: "SALES",
};

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.SALES,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    mustChangePassword: { type: Boolean, default: false },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resetToken: { type: String },
    resetTokenExp: { type: Date },
  },
  { timestamps: true }
);

// methods/helpers
UserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain || "", this.passwordHash || "");
};

UserSchema.statics.hashPassword = async function (plain) {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
};

UserSchema.methods.toJSONSafe = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetToken;
  delete obj.resetTokenExp;
  return obj;
};

// prevent OverwriteModelError on hot reload / multiple imports
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
