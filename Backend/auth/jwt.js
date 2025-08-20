// auth/jwt.js
import jwt from "jsonwebtoken";

export function signUserJWT(user) {
  const payload = { sub: user._id.toString(), role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}
