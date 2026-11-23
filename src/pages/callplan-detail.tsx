import { useState } from "react";
import { ArrowLeft, CheckCheck, Lock, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionBadge, StatusBadge } from "@/components/status-badge";
import { Alert } from "@/pages/callplan-list";
import { useApp } from "@/store/app-store";
import { HARI, SIKLUS } from "@/data/seed";
import type { Callplan, CallplanLine } from "@/data/types";
import { cycleDays, findOverlaps, overlapMessage, visitDates } from "@/lib/callplan";
import { fmtDate, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/nav";

export function CallplanDetailPage({ id }: { id: string }) {
  const { callplans, outlets, salesmen, can, approveCallplan, publishCallplan, toast } = useApp();
  const cp = callplans.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"approve" | "publish" | null>(null);
  if (!cp) return <div className="text-muted-foreground">Callplan {id} tidak ditemukan. <button className="text-primary underline" onClick={() => navigate("callplan")}>Kembali</button></div>;

  const outletName = (oid: string) => outlets.find((o) => o.id === oid)?.name ?? oid;
  const salesName = (sid: string) => salesmen.find((s) => s.id === sid)?.name ?? sid;
  const locked = cp.status !== "Draft";
  const totalVisits = cp.lines.reduce((n, l) => n + visitDates(cp.startDate, cp.endDate, l.hari, l.siklus).length, 0);
  const overlaps = findOverlaps(callplans, cp.hub, cp.startDate, cp.endDate, cp.id);

  const run = (kind: "approve" | "publish") => {
    const r = kind === "approve" ? approveCallplan(cp.id) : publishCallplan(cp.id);
    setConfirm(null);
    if (!r.ok) return toast({ tone: "danger", title: kind === "approve" ? "Approve gagal" : "Publish gagal", desc: r.error });
    toast({ tone: "success", title: kind === "approve" ? `${cp.id} di-approve` : `${cp.id} di-publish`, desc: kind === "approve" ? "Callplan terkunci, tidak bisa diedit lagi" : "Jadwal kunjungan dikirim ke Mile Field" });
  };

  const actionBtn = (perm: string, label: string, el: JSX.Element) => (can(perm) ? el : <span title={`Butuh izin ${perm}`}>{el}</span>);

  return (
    <div className="space-y-4">
      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate("callplan")}><ArrowLeft className="h-4 w-4" /> Callplan</button>
      <PageHeader
        title={cp.id}
        subtitle={<span className="flex flex-wrap items-center gap-2"><StatusBadge s={cp.status} /> {cp.hub} · {fmtDate(cp.startDate)} – {fmtDate(cp.endDate)} ({cycleDays(cp.startDate, cp.endDate)} hari)</span>}
        action={<>
          {cp.status === "Draft" && actionBtn("edit_callplan", "Edit", <Button variant="outline" disabled={!can("edit_callplan")} onClick={() => setEditing(true)}><Pencil /> Edit</Button>)}
          {cp.status === "Draft" && actionBtn("approve_callplan", "Approve", <Button disabled={!can("approve_callplan") || overlaps.length > 0} onClick={() => setConfirm("approve")}><CheckCheck /> Approve</Button>)}
          {cp.status === "Approved" && actionBtn("publish_callplan", "Publish", <Button disabled={!can("publish_callplan")} onClick={() => setConfirm("publish")}><Send /> Publish</Button>)}
        </>}
      />
      {locked && <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground"><Lock className="h-4 w-4" /> Callplan sudah {cp.status} — tidak bisa diedit. Untuk perubahan, import callplan baru untuk siklus berikutnya.</div>}
      {!locked && overlaps.map((o) => <Alert key={o.other.id} tone="danger">Siklus bentrok — {overlapMessage(o)}. Ubah tanggal siklus sebelum approve.</Alert>)}

      <div className="grid gap-4 md:grid-cols-4">
        <Info label="Baris (toko × hari)" value={String(cp.lines.length)} />
        <Info label="Total kunjungan dalam siklus" value={String(totalVisits)} />
        <Info label="Created by" value={cp.createdBy} hint={fmtDate(cp.createdAt)} />
        <Info label="Updated by" value={cp.updatedBy} hint={fmtDate(cp.updatedAt)} />
      </div>

      <CycleStrip cp={cp} outletName={outletName} salesName={salesName} />

      <Tabs defaultValue="lines">
        <TabsList><TabsTrigger value="lines">Detail Callplan</TabsTrigger><TabsTrigger value="audit">Audit Trail ({cp.audit.length})</TabsTrigger></TabsList>
        <TabsContent value="lines">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Toko</TableHead><TableHead>Salesman</TableHead><TableHead>Hari</TableHead><TableHead>Siklus</TableHead><TableHead>Tanggal kunjungan</TableHead></TableRow></TableHeader>
              <TableBody>
                {cp.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{outletName(l.outletId)}</TableCell><TableCell>{salesName(l.salesmanId)}</TableCell><TableCell>{l.hari}</TableCell><TableCell>{l.siklus}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{visitDates(cp.startDate, cp.endDate, l.hari, l.siklus).map((d) => fmtDate(d)).join(", ") || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">File sumber: {cp.fileName} · biweekly = minggu ke-1, 3, 5 dihitung dari start cycle date</p>
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Aksi</TableHead><TableHead>Oleh</TableHead><TableHead>Keterangan</TableHead></TableRow></TableHeader>
              <TableBody>
                {[...cp.audit].reverse().map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-sm">{fmtDate(a.at)}</TableCell><TableCell><ActionBadge a={a.action} /></TableCell>
                    <TableCell className="text-sm">{a.by}</TableCell><TableCell className="text-sm text-muted-foreground">{a.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {editing && <EditDialog cp={cp} onClose={() => setEditing(false)} />}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm === "approve" ? "Approve callplan?" : "Publish callplan?"}</DialogTitle>
            <DialogDescription>
              {confirm === "approve" ? `${cp.id} akan dikunci. Setelah approved, callplan tidak bisa diedit.` : `${totalVisits} jadwal kunjungan ${cp.hub} (${fmtDate(cp.startDate)} – ${fmtDate(cp.endDate)}) akan dikirim ke Mile Field.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Batal</Button>
            <Button onClick={() => confirm && run(confirm)}>{confirm === "approve" ? "Approve" : "Publish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** One card per date from start to end cycle; empty dates are shown too. */
function CycleStrip({ cp, outletName, salesName }: { cp: Callplan; outletName: (id: string) => string; salesName: (id: string) => string }) {
  const today = todayIso();
  const days: string[] = [];
  for (let d = new Date(cp.startDate + "T00:00:00"); d <= new Date(cp.endDate + "T00:00:00"); d.setDate(d.getDate() + 1))
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  const byDate = new Map<string, CallplanLine[]>(days.map((d) => [d, []]));
  cp.lines.forEach((l) => visitDates(cp.startDate, cp.endDate, l.hari, l.siklus).forEach((d) => byDate.get(d)?.push(l)));

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Jadwal per tanggal · {fmtDate(cp.startDate)} – {fmtDate(cp.endDate)}</CardTitle></CardHeader>
      <CardContent>
        <div className="mile-scroll flex gap-3 overflow-x-auto pb-2">
          {days.map((d) => {
            const list = byDate.get(d)!;
            const isToday = d === today;
            return (
              <div key={d} className={cn("flex w-56 shrink-0 flex-col rounded-md border bg-background", isToday ? "border-primary ring-1 ring-primary/30" : "border-border")}>
                <div className="flex items-center justify-between rounded-t-md bg-muted px-3 py-2">
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">{DAY_NAMES[new Date(d + "T00:00:00").getDay()]}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(d)}{isToday ? " · Hari ini" : ""}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", list.length ? "bg-accent text-accent-foreground" : "bg-[#E8E8E8] text-[#4F4F4F]")}>{list.length} toko</span>
                </div>
                {list.length > 0 && (
                  <p className="truncate border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
                    {[...new Set(list.map((l) => l.salesmanId))].map((sid) => `${salesName(sid)} ${list.filter((l) => l.salesmanId === sid).length}`).join(" · ")}
                  </p>
                )}
                <div className="mile-scroll max-h-[360px] flex-1 space-y-1.5 overflow-y-auto p-2">
                  {list.map((l) => (
                    <div key={l.id} className="rounded-md border border-border px-2.5 py-1.5">
                      <p className="truncate text-sm font-medium" title={outletName(l.outletId)}>{outletName(l.outletId)}</p>
                      <p className="text-xs text-muted-foreground">{salesName(l.salesmanId)} · {l.siklus}</p>
                    </div>
                  ))}
                  {!list.length && <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada kunjungan</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContent></Card>
  );
}

function EditDialog({ cp, onClose }: { cp: Callplan; onClose: () => void }) {
  const { callplans, outlets, salesmen, editCallplan, toast } = useApp();
  const [start, setStart] = useState(cp.startDate);
  const [end, setEnd] = useState(cp.endDate);
  const [lines, setLines] = useState<CallplanLine[]>(cp.lines);
  const hubOutlets = outlets.filter((o) => o.hub === cp.hub);
  const hubSales = salesmen.filter((s) => s.hub === cp.hub);
  const set = (id: string, patch: Partial<CallplanLine>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const name = (oid: string) => outlets.find((o) => o.id === oid)?.name ?? oid;

  const dupKeys = new Set<string>();
  const dup = lines.some((l) => { const k = `${l.outletId}|${l.salesmanId}|${l.hari}`; if (dupKeys.has(k)) return true; dupKeys.add(k); return false; });
  const overlaps = start && end && end >= start ? findOverlaps(callplans, cp.hub, start, end, cp.id) : [];

  const summary = () => {
    const notes: string[] = [];
    if (start !== cp.startDate || end !== cp.endDate) notes.push(`siklus ${cp.startDate}–${cp.endDate} → ${start}–${end}`);
    const before = new Map(cp.lines.map((l) => [l.id, l]));
    const added = lines.filter((l) => !before.has(l.id)).length;
    const removed = cp.lines.filter((l) => !lines.some((x) => x.id === l.id)).length;
    lines.forEach((l) => {
      const b = before.get(l.id);
      if (!b) return;
      const ch: string[] = [];
      if (b.outletId !== l.outletId) ch.push(`toko ${name(b.outletId)} → ${name(l.outletId)}`);
      if (b.salesmanId !== l.salesmanId) ch.push("salesman diganti");
      if (b.hari !== l.hari) ch.push(`hari ${b.hari} → ${l.hari}`);
      if (b.siklus !== l.siklus) ch.push(`siklus ${b.siklus} → ${l.siklus}`);
      if (ch.length) notes.push(`${name(l.outletId)}: ${ch.join(", ")}`);
    });
    if (added) notes.push(`${added} baris ditambah`);
    if (removed) notes.push(`${removed} baris dihapus`);
    return notes.join("; ");
  };

  const save = () => {
    const note = summary();
    if (!note) return onClose();
    const r = editCallplan(cp.id, { startDate: start, endDate: end, lines }, note);
    if (!r.ok) return toast({ tone: "danger", title: "Gagal menyimpan", desc: r.error });
    toast({ tone: "success", title: `${cp.id} diperbarui`, desc: note });
    onClose();
  };

  // native <select>: dozens of rows x 4 Radix Selects made the dialog freeze
  const sel = (value: string, onChange: (v: string) => void, items: { v: string; l: string }[]) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
      {items.map((i) => <option key={i.v} value={i.v}>{i.l}</option>)}
    </select>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Edit {cp.id}</DialogTitle><DialogDescription>Hanya callplan Draft yang bisa diedit. Hub: {cp.hub}.</DialogDescription></DialogHeader>
<div className="space-y-4 px-6 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Start cycle date</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End cycle date</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        {end < start && <Alert tone="danger">End cycle date harus sama atau setelah start cycle date</Alert>}
        {overlaps.map((o) => <Alert key={o.other.id} tone="danger">Siklus bentrok — {overlapMessage(o)}</Alert>)}
        {dup && <Alert tone="danger">Ada baris duplikat (toko, salesman & hari sama)</Alert>}
        <div className="mile-scroll max-h-80 overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader><TableRow><TableHead>Toko</TableHead><TableHead>Salesman</TableHead><TableHead>Hari</TableHead><TableHead>Siklus</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="min-w-44">{sel(l.outletId, (v) => set(l.id, { outletId: v }), hubOutlets.map((o) => ({ v: o.id, l: o.name })))}</TableCell>
                  <TableCell className="min-w-32">{sel(l.salesmanId, (v) => set(l.id, { salesmanId: v }), hubSales.map((s) => ({ v: s.id, l: s.name })))}</TableCell>
                  <TableCell className="min-w-28">{sel(l.hari, (v) => set(l.id, { hari: v as CallplanLine["hari"] }), HARI.map((h) => ({ v: h, l: h })))}</TableCell>
                  <TableCell className="min-w-28">{sel(l.siklus, (v) => set(l.id, { siklus: v as CallplanLine["siklus"] }), SIKLUS.map((s) => ({ v: s, l: s })))}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}><Trash2 className="text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="outline" size="sm" className="w-fit" disabled={!hubOutlets.length || !hubSales.length}
          onClick={() => setLines((ls) => [...ls, { id: `L${Date.now()}`, outletId: hubOutlets[0].id, salesmanId: hubSales[0].id, hari: "Senin", siklus: "weekly" }])}>
          <Plus /> Tambah baris
        </Button>
</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button disabled={end < start || overlaps.length > 0 || dup || !lines.length} onClick={save}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
