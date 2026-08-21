import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export async function AdminGuarded({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if (!auth) {
    const user = await requireUser();
    // Signed-in regular users must not see admin UI — access denied, not a soft hide.
    if (user) redirect("/login?next=/admin&error=access_denied");
    redirect("/admin/login?next=/admin");
  }
  return <AdminShell name={auth.user.name}>{children}</AdminShell>;
}
