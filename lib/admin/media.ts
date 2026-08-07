import { unlink } from "fs/promises";
import path from "path";

/** Only unlink files under public/uploads that this app owns. */
export async function removeOwnedUpload(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  const normalized = path.normalize(publicPath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!normalized.startsWith("/uploads/") && !normalized.startsWith("uploads/")) return;

  const relative = normalized.replace(/^\//, "");
  const fullPath = path.join(process.cwd(), "public", relative);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  if (!fullPath.startsWith(uploadsRoot + path.sep) && fullPath !== uploadsRoot) return;

  try {
    await unlink(fullPath);
  } catch {
    // Missing files are fine after prior cleanup.
  }
}

export async function removeOwnedUploads(paths: Array<string | null | undefined>): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean) as string[])];
  await Promise.all(unique.map((p) => removeOwnedUpload(p)));
}
