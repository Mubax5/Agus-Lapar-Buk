"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GearIcon as Gear, LockKeyIcon as LockKey, UsersThreeIcon as UsersThree } from "@phosphor-icons/react";
import { PageHeader } from "@/components/ui/page-header";
import { CloudflarePageShell, DataTableSurface, MainAsideLayout } from "@/components/ui/page-primitives";
import { fetchWorkspaceSettings } from "@/lib/api";
import { useSettingsCopy } from "@/components/settings/settings-copy";

export default function SettingsPage() {
  const { t } = useSettingsCopy();
  const result = useQuery({ queryKey: ["workspace-settings"], queryFn: fetchWorkspaceSettings });
  const organization = result.data?.organization as Record<string, unknown> | undefined;
  const categories = [
    ["/settings/general", t.general, t.generalDescription],
    ["/settings/review-policy", t.reviewPolicy, t.reviewPolicyDescription],
    ["/settings/documents", t.documentPolicy, t.documentPolicyDescription],
    ["/settings/notifications", t.notifications, t.notificationsDescription],
    ["/settings/retention", t.retention, t.retentionDescription],
    ["/settings/security", t.security, t.securityDescription],
  ] as const;

  return <CloudflarePageShell className="operations-page settings-page">
    <PageHeader icon={Gear} title={t.workspaceSettings} description={t.workspaceSettingsDescription} />
    <MainAsideLayout className="settings-overview-grid">
      <DataTableSurface title={t.configuration} description={t.configurationDescription}>
        <nav className="settings-card-list" aria-label={t.configuration}>
          {categories.map(([href, title, description]) => <Link className="settings-card" href={href} key={href}>
            <span className="settings-card__copy"><span className="settings-card__title">{title}</span><span className="settings-card__description">{description}</span></span>
            <span className="settings-card__chevron" aria-hidden="true">›</span>
          </Link>)}
        </nav>
      </DataTableSurface>
      <aside aria-label={t.workspace}>
        <DataTableSurface className="settings-context-rail" title={String(organization?.name || "GateGuard Operations")} description={t.workspace}>
          <dl>
            <div><dt>{t.code}</dt><dd>{String(organization?.code || "—")}</dd></div>
            <div><dt>{t.timezone}</dt><dd>{String(organization?.default_timezone || "UTC")}</dd></div>
            <div><dt>{t.currency}</dt><dd>{String(organization?.default_currency || "USD")}</dd></div>
            <div><dt>{t.protection}</dt><dd>{t.serverSideSessions}</dd></div>
          </dl>
          <div className="context-rail__links"><Link href="/settings/people"><UsersThree size={16} /> {t.peopleAndAccess}</Link><Link href="/settings/security"><LockKey size={16} /> {t.security}</Link></div>
        </DataTableSurface>
      </aside>
    </MainAsideLayout>
  </CloudflarePageShell>;
}
