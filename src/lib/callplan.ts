import * as XLSX from "xlsx";
import type { Callplan, CallplanLine, Hari, Outlet, Salesman, Siklus } from "@/data/types";
import { HARI, SIKLUS } from "@/data/seed";
import { fmtDate } from "@/lib/format";

/* ---------- cycle overlap ---------- */

export type OverlapKind = "redundant" | "slicing";
export interface Overlap { kind: OverlapKind; other: Callplan }

/**
 * A Hub can have only one callplan per date. Any other callplan of the same Hub
 * (Draft, Approved or Published) whose cycle touches [start, end] is a conflict:
 * - redundant: exactly the same cycle dates
 * - slicing: the cycles partly overlap or one sits inside the other
 */
export function findOverlaps(all: Callplan[], hub: string, start: string, end: string, excludeId?: string): Overlap[] {
  return all
    .filter((c) => c.id !== excludeId && c.hub === hub && c.startDate <= end && start <= c.endDate)
    .map((c) => ({ kind: c.startDate === start && c.endDate === end ? "redundant" : "slicing", other: c }));
}

export function overlapMessage(o: Overlap) {
  const k = o.kind === "redundant" ? "Redundant (siklus sama persis)" : "Slicing (tanggal beririsan)";
  return `${k} dengan ${o.other.id} · ${o.other.hub} · ${fmtDate(o.other.startDate)} – ${fmtDate(o.other.endDate)} (${o.other.status})`;
}

/* ---------- visit dates inside a cycle ---------- */

const DOW: Record<Hari, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
const parse = (iso: string) => new Date(iso + "T00:00:00");
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** weekly = every matching day; biweekly = weeks 1, 3, 5... counted from the cycle start. */
export function visitDates(start: string, end: string, hari: Hari, siklus: Siklus): string[] {
  const out: string[] = [];
  const s = parse(start);
  const e = parse(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== DOW[hari]) continue;
    const week = Math.floor((d.getTime() - s.getTime()) / (7 * 86400000));
    if (siklus === "weekly" || week % 2 === 0) out.push(iso(d));
  }
  return out;
}

export const cycleDays = (start: string, end: string) => Math.round((parse(end).getTime() - parse(start).getTime()) / 86400000) + 1;

/* ---------- import ---------- */

export interface ParsedRow { row: number; toko: string; salesman: string; hari: string; siklus: string }
export interface ParsedFile { rows: ParsedRow[]; hub?: string; startDate?: string; endDate?: string; error?: string }

const MONTHS_ID = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
const norm = (v: unknown) => String(v ?? "").trim();

/** Accepts "23 November", "23 November 2026", "2026-11-23", "23/11/2026" or an Excel date serial. */
function toIsoDate(v: unknown, year: number): string | undefined {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = norm(v).toLowerCase();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
  if (m) {
    const mi = MONTHS_ID.findIndex((x) => x.startsWith(m![2].slice(0, 3)));
    if (mi >= 0) return `${m[3] ?? year}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return undefined;
}

/**
 * Reads the first sheet. Data starts after the header row "Toko | Salesman | Hari | Siklus".
 * Optional info row above it (like the client sample): "start date cycle : | 23 November | end date cycle : | 27 November | Hub : Jakarta"
 * is used only to pre-fill the import form.
 */
export function parseWorkbook(buf: ArrayBuffer, year: number): ParsedFile {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
  const headerIdx = grid.findIndex((r) => r.some((c) => norm(c).toLowerCase() === "toko"));
  if (headerIdx < 0) return { rows: [], error: "Header kolom Toko | Salesman | Hari | Siklus tidak ditemukan." };

  const out: ParsedFile = { rows: [] };
  for (const r of grid.slice(0, headerIdx)) {
    r.forEach((c, i) => {
      const t = norm(c).toLowerCase();
      const next = r[i + 1];
      if (t.startsWith("start date cycle") || t.startsWith("start cycle")) out.startDate = toIsoDate(t.split(":")[1]?.trim() || next, year);
      if (t.startsWith("end date cycle") || t.startsWith("end cycle")) out.endDate = toIsoDate(t.split(":")[1]?.trim() || next, year);
      if (t.startsWith("hub")) out.hub = norm(String(c).split(":")[1]) || norm(next);
    });
  }
  const header = grid[headerIdx].map((c) => norm(c).toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const [ct, cs, ch, cy] = [col("toko"), col("salesman"), col("hari"), col("siklus")];
  grid.slice(headerIdx + 1).forEach((r, i) => {
    const row = { row: headerIdx + i + 2, toko: norm(r[ct]), salesman: norm(r[cs]), hari: norm(r[ch]), siklus: norm(r[cy]) };
    if (row.toko || row.salesman || row.hari || row.siklus) out.rows.push(row);
  });
  return out;
}

export interface CheckedRow extends ParsedRow { errors: string[]; line?: Omit<CallplanLine, "id"> }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Validates rows against master data of the selected Hub and flags duplicate (redundant) rows inside the file. */
export function checkRows(rows: ParsedRow[], hub: string, outlets: Outlet[], salesmen: Salesman[]): CheckedRow[] {
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const errors: string[] = [];
    const outlet = outlets.find((o) => o.name.toLowerCase() === r.toko.toLowerCase());
    const sm = salesmen.find((s) => s.name.toLowerCase() === r.salesman.toLowerCase());
    const hari = HARI.find((h) => h === cap(r.hari));
    const siklus = SIKLUS.find((s) => s === r.siklus.toLowerCase());
    if (!outlet) errors.push(`Toko "${r.toko || "-"}" tidak ada di master Outlet`);
    else if (outlet.hub !== hub) errors.push(`Toko milik Hub ${outlet.hub}, bukan ${hub}`);
    if (!sm) errors.push(`Salesman "${r.salesman || "-"}" tidak ada di master Salesman`);
    else if (sm.hub !== hub) errors.push(`Salesman milik Hub ${sm.hub}, bukan ${hub}`);
    if (!hari) errors.push(`Hari "${r.hari || "-"}" tidak valid (Senin–Sabtu)`);
    if (!siklus) errors.push(`Siklus "${r.siklus || "-"}" tidak valid (weekly / biweekly)`);
    const key = `${r.toko}|${r.salesman}|${cap(r.hari)}`.toLowerCase();
    if (seen.has(key)) errors.push(`Duplikat baris ${seen.get(key)} (toko, salesman & hari sama)`);
    else seen.set(key, r.row);
    return { ...r, errors, line: errors.length ? undefined : { outletId: outlet!.id, salesmanId: sm!.id, hari: hari!, siklus: siklus! } };
  });
}

/** Template in the client's format (info row + 4 columns). */
export function downloadTemplate(sample: boolean) {
  const rows: unknown[][] = [
    ["start date cycle :", "23 November 2026", "end date cycle :", "27 November 2026", "Hub : Jakarta"],
    [],
    ["Toko", "Salesman", "Hari", "Siklus"],
  ];
  if (sample)
    rows.push(
      ["Toko Haris", "Haris", "Selasa", "biweekly"],
      ["Toko Sandhy", "Haris", "Senin", "biweekly"],
      ["Toko Frengky", "Haris", "Senin", "weekly"],
      ["Toko Mile", "Haris", "Senin", "weekly"],
      ["Toko Mile", "Haris", "Senin", "biweekly"],
    );
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Callplan");
  XLSX.writeFile(wb, sample ? "contoh_callplan_jakarta.xlsx" : "template_callplan.xlsx");
}

/** Builds the same sample as an in-memory workbook so the demo works without a file. */
export function sampleWorkbook(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ["start date cycle :", "23 November 2026", "end date cycle :", "27 November 2026", "Hub : Jakarta"],
    [],
    ["Toko", "Salesman", "Hari", "Siklus"],
    ["Toko Haris", "Haris", "Selasa", "biweekly"],
    ["Toko Sandhy", "Haris", "Senin", "biweekly"],
    ["Toko Frengky", "Haris", "Senin", "weekly"],
    ["Toko Mile", "Haris", "Senin", "weekly"],
    ["Toko Mile", "Haris", "Senin", "biweekly"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Callplan");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
