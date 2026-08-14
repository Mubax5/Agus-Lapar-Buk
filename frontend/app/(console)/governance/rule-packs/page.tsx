"use client";

import { Table } from "@cloudflare/kumo/components/table";
import { ListChecksIcon as Rules } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTableSurface, EmptyState } from "@/components/ui/page-primitives";
import { OperationalState, StateNotice } from "@/components/ui/operational-primitives";
import { PageHeader } from "@/components/ui/page-header";
import { AppSelect } from "@/components/ui/select";
import { fetchOperationsList } from "@/lib/api";

type RulePack = { id: string; name: string; version: string; scope: string; status: string; source: string; effective_from?: string | null; published_at?: string | null; published_by_display_name?: string | null };
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "Belum ditetapkan";
const sourceLabel: Record<string, string> = { WORKSPACE: "Workspace", SHARED_BASELINE: "Shared baseline" };

export default function RulePacksPage() {
  const [status, setStatus] = useState("all");
  const result = useQuery({ queryKey: ["rule-packs"], queryFn: () => fetchOperationsList("/rule-packs") });
  const items = useMemo(() => (result.data?.items || []) as RulePack[], [result.data]);
  const visible = items.filter((item) => status === "all" || item.status === status);
  return <div className="operations-page cf-rule-packs-page">
    <PageHeader icon={Rules} title="Rule packs" description="Policy pack deterministik yang menjelaskan bagaimana assurance mengevaluasi pengiriman. Publish membuat versi immutable." />
    <StateNotice title="Aturan dan evaluasi model dipisahkan" tone="info">Rule packs menjalankan compliance decision deterministik. Status extraction/OCR atau confidence model tidak dapat mengubah rule pack menjadi source of truth.</StateNotice>
    <section className="cf-governance-toolbar"><span className="cf-label">Status</span><AppSelect ariaLabel="Filter status rule pack" value={status} onValueChange={setStatus} options={[{ value: "all", label: "Semua status" }, { value: "DRAFT", label: "DRAFT" }, { value: "PUBLISHED", label: "PUBLISHED" }]} /></section>
    <DataTableSurface title="Rule packs" description={`${visible.length} dari ${items.length} pack yang tersedia untuk workspace ini. Source menunjukkan ownership policy.`}>{result.isLoading ? <div className="cf-table-loading">Memuat rule packs…</div> : result.error ? <EmptyState icon={<Rules size={18} />} title="Rule packs tidak dapat dimuat" description={result.error instanceof Error ? result.error.message : "Coba muat ulang governance register."} /> : !visible.length ? <EmptyState icon={<Rules size={18} />} title="Tidak ada rule pack yang cocok" description="Ubah filter untuk melihat policy pack lain." /> : <div className="table-scroll"><Table><Table.Header sticky><Table.Row><Table.Head>Rule pack</Table.Head><Table.Head>Versi</Table.Head><Table.Head>Status</Table.Head><Table.Head>Scope</Table.Head><Table.Head>Source</Table.Head><Table.Head>Effective</Table.Head><Table.Head>Publisher</Table.Head><Table.Head aria-label="Aksi" /></Table.Row></Table.Header><Table.Body>{visible.map((item) => <Table.Row key={item.id}><Table.Cell><Link className="table-link table-cell-primary" href={`/governance/rule-packs/${item.id}`}>{item.name}</Link></Table.Cell><Table.Cell><span className="mono">{item.version}</span></Table.Cell><Table.Cell><OperationalState value={item.status} /></Table.Cell><Table.Cell>{item.scope}</Table.Cell><Table.Cell>{sourceLabel[item.source] || item.source}</Table.Cell><Table.Cell><span className="cf-table-date">{date(item.effective_from)}</span></Table.Cell><Table.Cell>{item.published_by_display_name || (item.status === "DRAFT" ? "Belum dipublish" : "Tidak tersedia")}</Table.Cell><Table.Cell><Link className="table-link cf-table-action-link" href={`/governance/rule-packs/${item.id}`}>Review</Link></Table.Cell></Table.Row>)}</Table.Body></Table></div>}</DataTableSurface>
  </div>;
}
