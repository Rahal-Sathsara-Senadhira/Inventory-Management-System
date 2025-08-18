// Backend/corsConfig.js
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173", // Vite dev
];

export default cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-tenant-id", "Authorization"],
  credentials: true,
  maxAge: 600,
});
