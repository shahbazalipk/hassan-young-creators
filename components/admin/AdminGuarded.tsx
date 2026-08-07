import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export async function AdminGuarded({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if (!auth) redirect("/admin/login");
  return <AdminShell name={auth.user.name}>{children}</AdminShell>;
}
