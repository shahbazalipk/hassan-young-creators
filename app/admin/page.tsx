import { AdminGuarded } from "@/components/admin/AdminGuarded";
import { DashboardDangerControls } from "@/components/admin/danger/DashboardDangerControls";
import { getAdminDashboardStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <AdminGuarded>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="mt-1 text-slate-500">
            A calm overview of Hassan’s portfolio and child-safe community features.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total projects" value={stats.totalProjects} />
          <Stat label="Published projects" value={stats.publishedProjects} />
          <Stat label="Draft projects" value={stats.draftProjects} />
          <Stat label="Skills listed" value={stats.skills} />
          <Stat label="Achievements" value={stats.achievements} />
          <Stat label="Contact messages" value={stats.messages} />
          <Stat label="Pending child submissions" value={stats.pendingChildSubmissions} />
          <Stat label="Approved guestbook" value={stats.approvedGuestbook} />
        </div>

        <DashboardDangerControls
          initialActivity={stats.recentActivity.map((item) => ({
            id: item.id,
            summary: item.summary,
            createdAt: item.createdAt.toISOString(),
            userName: item.user?.name || null,
          }))}
        />
      </div>
    </AdminGuarded>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="admin-card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}
