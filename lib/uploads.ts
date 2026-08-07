import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { randomToken } from "@/lib/security";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function saveSafeImage(file: File, folder = "projects"): Promise<string> {
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 2_097_152);
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }
  if (file.size > maxBytes) {
    throw new Error("Image is too large. Please keep uploads under 2MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${randomToken(8)}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);

  // Re-encode and strip metadata for safety.
  await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(fullPath);

  return `/uploads/${folder}/${filename}`;
}
