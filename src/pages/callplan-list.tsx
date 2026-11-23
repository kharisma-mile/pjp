import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { useApp } from "@/store/app-store";
import { HUBS } from "@/data/seed";
import { checkRows, downloadTemplate, findOverlaps, overlapMessage, parseWorkbook, sampleWorkbook, type ParsedRow } from "@/lib/callplan";
import { fmtDate } from "@/lib/format";
import { navigate } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function CallplanListPage() {
  const { callplans, can } = useApp();
  const [q, setQ] = useState("");
  const [hub, setHub] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const list = callplans
    .filter((c) => (hub === "all" || c.hub === hub) && (status === "all" || c.status === status) && (c.id + c.fileName).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-4">
      <PageHeader title="Callplan" subtitle="Import callplan per Hub & siklus → Approve → Publish ke Mile Field. Callplan yang sudah Approved tidak bisa diedit."
        action={<>
          <Button variant="outline" onClick={() => downloadTemplate(false)}><Download /> Template</Button>
          <Button disabled={!can("import_callplan")} title={can("import_callplan") ? "" : "Butuh izin import_callplan"} onClick={() => setOpen(true)}><Upload /> Import Callplan</Button>
        </>} />

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari ID / nama file..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={hub} onValueChange={setHub}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua Hub</SelectItem>{HUBS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Semua status</SelectItem>{["Draft", "Approved", "Published"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Callplan</TableHead><TableHead>Hub</TableHead><TableHead>Siklus</TableHead><TableHead className="text-right">Baris</TableHead>
              <TableHead>Status</TableHead><TableHead>Created by</TableHead><TableHead>Updated by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`callplan/${c.id}`)}>
                <TableCell><span className="font-semibold text-primary">{c.id}</span><p className="text-xs text-muted-foreground">{c.fileName}</p></TableCell>
                <TableCell>{c.hub}</TableCell>
                <TableCell className="whitespace-nowrap">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</TableCell>
                <TableCell className="text-right">{c.lines.length}</TableCell>
                <TableCell><StatusBadge s={c.status} /></TableCell>
                <TableCell><p className="text-sm">{c.createdBy}</p><p className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</p></TableCell>
                <TableCell><p className="text-sm">{c.updatedBy}</p><p className="text-xs text-muted-foreground">{fmtDate(c.updatedAt)}</p></TableCell>
              </TableRow>
            ))}
            {!list.length && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Belum ada callplan</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
      {open && <ImportDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const { callplans, outlets, salesmen, importCallplan, toast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hub, setHub] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileError, setFileError] = useState("");

  const load = (buf: ArrayBuffer, name: string) => {
    const p = parseWorkbook(buf, Number(start.slice(0, 4)) || 2026);
    setFileName(name);
    setFileError(p.error ?? "");
    setRows(p.error ? null : p.rows);
    // pre-fill the form from the info row in the file (only empty fields)
    if (p.hub && HUBS.includes(p.hub) && !hub) setHub(p.hub);
    if (p.startDate && !start) setStart(p.startDate);
    if (p.endDate && !end) setEnd(p.endDate);
  };

  const checked = useMemo(() => (rows && hub ? checkRows(rows, hub, outlets, salesmen) : []), [rows, hub, outlets, salesmen]);
  const valid = checked.filter((r) => r.line);
  const invalid = checked.filter((r) => !r.line);
  const dateError = start && end && end < start ? "End cycle date harus sama atau setelah start cycle date" : "";
  const overlaps = hub && start && end && !dateError ? findOverlaps(callplans, hub, start, end) : [];
  const ready = hub && start && end && !dateError && !overlaps.length && rows && valid.length > 0;

  const submit = () => {
    const r = importCallplan({ hub, startDate: start, endDate: end, fileName, lines: valid.map((v) => v.line!) });
    if (!r.ok) return toast({ tone: "danger", title: "Import gagal", desc: r.error });
    toast({ tone: "success", title: `${r.id} dibuat (Draft)`, desc: `${valid.length} baris diimport${invalid.length ? `, ${invalid.length} baris dilewati` : ""}` });
    onClose();
    navigate(`callplan/${r.id}`);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Callplan</DialogTitle>
          <DialogDescription>Isi Hub dan tanggal siklus, lalu upload file Excel dengan kolom Toko | Salesman | Hari | Siklus.</DialogDescription>
        </DialogHeader>
<div className="space-y-4 px-6 py-4">

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Hub</Label>
            <Select value={hub} onValueChange={setHub}>
              <SelectTrigger><SelectValue placeholder="Pilih Hub" /></SelectTrigger>
              <SelectContent>{HUBS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Start cycle date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End cycle date</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        {dateError && <Alert tone="danger">{dateError}</Alert>}
        {overlaps.map((o) => <Alert key={o.other.id} tone="danger">Siklus bentrok — {overlapMessage(o)}. Satu Hub hanya boleh punya satu callplan per tanggal.</Alert>)}

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-4">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{fileName || "Belum ada file"}</span>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) load(await f.arrayBuffer(), f.name); e.target.value = ""; }} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload /> Pilih file</Button>
          <Button variant="ghost" size="sm" onClick={() => load(sampleWorkbook(), "contoh_callplan_jakarta.xlsx")}>Pakai contoh file</Button>
        </div>
        {fileError && <Alert tone="danger">{fileError}</Alert>}
        {rows && !hub && <Alert tone="warning">Pilih Hub dulu untuk memvalidasi baris.</Alert>}

        {checked.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm"><span className="font-semibold text-[#198754]">{valid.length} valid</span>{invalid.length > 0 && <> · <span className="font-semibold text-[#BF2130]">{invalid.length} error (akan dilewati)</span></>}</p>
            <div className="mile-scroll max-h-64 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader><TableRow><TableHead>Baris</TableHead><TableHead>Toko</TableHead><TableHead>Salesman</TableHead><TableHead>Hari</TableHead><TableHead>Siklus</TableHead><TableHead>Hasil</TableHead></TableRow></TableHeader>
                <TableBody>
                  {checked.map((r) => (
                    <TableRow key={r.row} className={cn(!r.line && "bg-[#FAE5E7]/50")}>
                      <TableCell className="text-muted-foreground">{r.row}</TableCell>
                      <TableCell>{r.toko}</TableCell><TableCell>{r.salesman}</TableCell><TableCell>{r.hari}</TableCell><TableCell>{r.siklus}</TableCell>
                      <TableCell>{r.line ? <CheckCircle2 className="h-4 w-4 text-[#198754]" /> : <span className="text-xs text-[#BF2130]">{r.errors.join("; ")}</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
</div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button disabled={!ready} onClick={submit}>Import {valid.length ? `${valid.length} baris` : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Alert({ tone, children }: { tone: "danger" | "warning"; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-sm", tone === "danger" ? "bg-[#FAE5E7] text-[#68121A]" : "bg-[#FFF4D1] text-[#6B5000]")}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{children}</span>
    </div>
  );
}
