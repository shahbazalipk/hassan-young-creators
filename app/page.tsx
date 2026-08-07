import { getPublicSiteData } from "@/lib/data";
import { createCsrfToken } from "@/lib/csrf";
import { requireAdmin } from "@/lib/auth";
import { PublicSite } from "@/components/public/PublicSite";
import { MaintenancePage } from "@/components/public/MaintenancePage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [data, auth] = await Promise.all([getPublicSiteData(), requireAdmin()]);
  // Self-validating HMAC token — no cookie write needed in a Server Component.
  const csrfToken = createCsrfToken();

  if (data.settings?.maintenanceMode) {
    return <MaintenancePage footer={data.settings.footerText} />;
  }

  return (
    <PublicSite
      data={data}
      csrfToken={csrfToken}
      showAdminPanel={Boolean(auth)}
    />
  );
}
