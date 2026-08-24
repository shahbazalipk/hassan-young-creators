/** Shared helpers for post-auth redirects (browser-safe). */

export function welcomeRedirect(nextPath: string, isAdmin = false): string {
  // Admins opening the admin panel skip the public welcome screen.
  if (isAdmin && nextPath.startsWith("/admin")) return nextPath;

  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.includes("://")
      ? nextPath
      : "/";

  if (safeNext === "/welcome" || safeNext.startsWith("/welcome?")) {
    return "/welcome?next=/";
  }

  return `/welcome?next=${encodeURIComponent(safeNext)}`;
}
