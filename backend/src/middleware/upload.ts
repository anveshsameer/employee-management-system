import multer from "multer";
import path from "path";
import crypto from "crypto";
import { AppError } from "../utils/AppError";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new AppError(400, "Only JPEG, PNG, or WEBP images are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("profileImage");
