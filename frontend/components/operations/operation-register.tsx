"use client";

import { Table } from "@cloudflare/kumo/components/table";
import { MagnifyingGlassIcon as MagnifyingGlass, PlusIcon as Plus, WarningCircleIcon as WarningCircle } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActionLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { fetchOperationsList } from "@/lib/api";

type Column = { label: string; value: (row: Record<string, unknown>) => React.ReactNode };

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function displayValue(value: unknown, fallback = "—"): string {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

export function formatTimestamp(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-GB");
}

const configs: Record<string, { title: string; description: string; path: string; columns: Column[]; action?: { href: string; label: string } }> = {
  documents: { title: "Documents", description: "Keep shipment evidence versioned, reviewable, and connected to its case.", path: "/documents", columns: [
    { label: "Document", value: (row) => <strong>{String(row.document_type)}</strong> },
    { label: "Shipment", value: (row) => String(row.shipment_reference) },
    { label: "Version", value: (row) => { const version = asRecord(row.version); return version.version ? `v${displayValue(version.version)}` : "—"; } },
    { label: "Extraction", value: (row) => { const version = asRecord(row.version); return displayValue(version.extraction_status, "Pending"); } },
    { label: "Status", value: (row) => <span className="table-status">{String(row.status)}</span> },
  ] },
  parties: { title: "Parties", description: "Maintain the trading parties involved in shipment cases.", path: "/parties", columns: [
    { label: "Party", value: (row) => <strong>{String(row.legal_name)}</strong> },
    { label: "Country", value: (row) => String(row.country_code || "—") },
    { label: "Identifier", value: (row) => String(row.external_identifier || row.tax_identifier || "—") },
    { label: "Screening", value: (row) => String(row.screening) },
    { label: "Shipments", value: (row) => String(row.shipment_count) },
  ] },
  products: { title: "Products & commodities", description: "See the items moving through your shipment cases and the evidence attached to them.", path: "/products", columns: [
    { label: "SKU", value: (row) => <strong>{String(row.sku || "Unassigned")}</strong> },
    { label: "Description", value: (row) => String(row.description) },
    { label: "Shipment", value: (row) => String(row.shipment_reference) },
    { label: "Quantity", value: (row) => `${String(row.quantity)} ${String(row.unit_of_measure)}` },
    { label: "Dangerous goods", value: (row) => row.dangerous_goods ? "Review required" : "No" },
  ] },
  transport: { title: "Transport", description: "Record planned movement, carriers, and equipment without pretending to provide live tracking.", path: "/transport", columns: [
    { label: "Mode", value: (row) => <strong>{String(row.mode)}</strong> },
    { label: "Carrier", value: (row) => String(row.carrier || "—") },
    { label: "Origin", value: (row) => String(row.origin || "—") },
    { label: "Destination", value: (row) => String(row.destination || "—") },
    { label: "Planned arrival", value: (row) => formatTimestamp(row.planned_arrival) },
  ] },
  requirements: { title: "Requirements", description: "Understand which evidence is expected for each shipment and why.", path: "/requirements", columns: [
    { label: "Requirement", value: (row) => <strong>{displayValue(asRecord(row.requirement).name)}</strong> },
    { label: "Shipment", value: (row) => displayValue(row.shipment_reference) },
    { label: "Document type", value: (row) => displayValue(asRecord(row.requirement).document_type) },
    { label: "Result", value: (row) => <span className="table-status">{displayValue(asRecord(row.evaluation).result)}</span> },
    { label: "Reason", value: (row) => displayValue(asRecord(row.evaluation).reason) },
  ] },
  assurance: { title: "Assurance checks", description: "Review checks across shipment cases, with evidence and the rule version that produced them.", path: "/assurance", columns: [
    { label: "Shipment", value: (row) => <strong>{String(row.shipment_reference)}</strong> },
    { label: "Check", value: (row) => String(row.check_type) },
    { label: "Status", value: (row) => <span className="table-status">{String(row.status)}</span> },
    { label: "Severity", value: (row) => String(row.severity) },
    { label: "Source", value: (row) => String(row.source) },
    { label: "Completed", value: (row) => formatTimestamp(row.completed_at) },
  ] },
  exceptions: { title: "Exceptions", description: "Resolve the issues that keep a shipment from moving forward.", path: "/exceptions", columns: [
    { label: "Severity", value: (row) => <span className="table-status">{String(row.severity)}</span> },
    { label: "Shipment", value: (row) => <strong>{String(row.shipment_reference)}</strong> },
    { label: "Exception", value: (row) => String(row.summary) },
    { label: "Assignee", value: (row) => String(row.assigned_to || "Unassigned") },
    { label: "Due", value: (row) => formatTimestamp(row.due_at) },
    { label: "Status", value: (row) => String(row.status) },
  ] },
  releases: { title: "Release decisions", description: "Review the immutable decisions that authorize, hold, or invalidate dispatch.", path: "/releases", columns: [
    { label: "Shipment", value: (row) => <strong>{String(row.shipment_reference)}</strong> },
    { label: "Decision", value: (row) => String(row.decision) },
    { label: "Issued by", value: (row) => String(row.issued_by_name) },
    { label: "Issued", value: (row) => formatTimestamp(row.created_at) },
    { label: "Reason", value: (row) => String(row.reason) },
  ] },
  screening: { title: "Party screening", description: "Keep screening honest: configured providers report results; unconfigured providers do not claim coverage.", path: "/screening", columns: [
    { label: "Party", value: (row) => <strong>{String(row.party)}</strong> },
    { label: "Shipment", value: (row) => String(row.shipment_reference) },
    { label: "Provider", value: (row) => displayValue(asRecord(row.run).provider) },
    { label: "Result", value: (row) => displayValue(asRecord(row.run).result) },
    { label: "Score", value: (row) => displayValue(asRecord(row.run).score) },
  ] },
  "dangerous-goods": { title: "Dangerous goods", description: "Review items that need complete dangerous-goods information before release.", path: "/dangerous-goods", columns: [
    { label: "Shipment", value: (row) => <strong>{String(row.shipment_reference)}</strong> },
    { label: "Item", value: (row) => displayValue(asRecord(row.item).description) },
    { label: "UN number", value: (row) => displayValue(asRecord(row.item).un_number, "Missing") },
    { label: "Hazard class", value: (row) => displayValue(asRecord(row.item).hazard_class, "Missing") },
    { label: "Assurance", value: (row) => String(row.assurance) },
  ] },
  connections: { title: "Connections", description: "See the systems configured to exchange shipment information with this workspace.", path: "/integrations/connections", columns: [
    { label: "Name", value: (row) => <strong>{String(row.name)}</strong> },
    { label: "Type", value: (row) => String(row.type) },
    { label: "Status", value: (row) => String(row.status) },
    { label: "Last success", value: (row) => formatTimestamp(row.last_success_at) },
    { label: "Last error", value: (row) => formatTimestamp(row.last_error_at) },
  ] },
  jobs: { title: "Processing jobs", description: "Track bounded extraction, assessment, and delivery work without hiding failures.", path: "/integrations/jobs", columns: [
    { label: "Job", value: (row) => <strong>{String(row.job_type)}</strong> },
    { label: "Status", value: (row) => String(row.status) },
    { label: "Attempts", value: (row) => String(row.attempts) },
    { label: "Queued", value: (row) => formatTimestamp(row.queued_at) },
    { label: "Error", value: (row) => String(row.safe_error || "—") },
  ] },
};

export function OperationRegister({ kind }: { kind: keyof typeof configs }) {
  const config = configs[kind];
  const [query, setQuery] = useState("");
  const result = useQuery({ queryKey: ["operations", kind, query], queryFn: () => fetchOperationsList(config.path, query ? { q: query } : undefined) });
  const rows = useMemo(() => result.data?.items || [], [result.data]);
  return <div className="operations-page">
    <PageHeader title={config.title} description={config.description} actions={config.action ? <ActionLink href={config.action.href} icon={Plus}>{config.action.label}</ActionLink> : undefined} />
    <div className="operations-toolbar"><label className="operations-search"><MagnifyingGlass size={16} /><span className="sr-only">Search {config.title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} /></label><span className="muted-label">{rows.length} records</span></div>
    {result.isError ? <div className="notice notice--danger"><WarningCircle size={18} /> This register is not available right now.</div> : <section className="data-panel data-panel--wide"><div className="table-scroll"><Table><Table.Header sticky><Table.Row>{config.columns.map((column) => <Table.Head key={column.label}>{column.label}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{rows.map((row) => <Table.Row key={String(row.id)}>{config.columns.map((column) => <Table.Cell key={column.label}>{column.value(row)}</Table.Cell>)}</Table.Row>)}</Table.Body></Table></div>{!result.isPending && rows.length === 0 && <div className="empty-state"><strong>No {config.title.toLowerCase()} yet</strong><span>Records appear here when your team creates them in this workspace.</span></div>}</section>}
  </div>;
}
