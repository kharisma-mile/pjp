import { useMemo, useState } from "react";
import { AlarmClock, CalendarClock, Footprints, GitBranch, Target, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionBadge, StatusBadge } from "@/components/status-badge";
import { useApp } from "@/store/app-store";
import { HUBS, TARGETS } from "@/data/seed";
import type { OppStage } from "@/data/types";
import { fmtDate, todayIso } from "@/lib/format";
import { buildVisits, pct, rupiahShort } from "@/lib/visits";
import { navigate } from "@/lib/nav";

const STAGES: OppStage[] = ["Prospek", "Dijadwalkan", "Negosiasi", "Menang", "Batal"];
const STAGE_V: Record<OppStage, "neutral" | "info" | "warning" | "success" | "danger"> = { Prospek: "neutral", Dijadwalkan: "info", Negosiasi: "warning", Menang: "success", Batal: "danger" };

function Bar({ label, sub, actual, target }: { label: string; sub?: string; actual: number; target: number }) {
  const p = pct(actual, target);
  const color = p >= 70 ? "bg-[#198754]" : p >= 50 ? "bg-primary" : "bg-[#FFC105]";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{sub ?? `${rupiahShort(actual)} / ${rupiahShort(target)}`} · <b className="text-foreground">{p}%</b></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E8E8]"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(p, 100)}%` }} /></div>
    </div>
  );
}

export function DashboardPage() {
  const { callplans, opps, salesmen, products } = useApp();
  const [hub, setHub] = useState("all");
  const today = todayIso();
  const inHub = (h: string) => hub === "all" || h === hub;
  const sms = salesmen.filter((s) => inHub(s.hub));
  const smIds = new Set(sms.map((s) => s.id));
  const smName = (id: string) => salesmen.find((s) => s.id === id)?.name ?? id;
  const hubOf = (id: string) => salesmen.find((s) => s.id === id)?.hub ?? "";

  const allVisits = useMemo(() => buildVisits(callplans, products, today), [callplans, products, today]);
  const d = useMemo(() => {
    const visits = allVisits.filter((v) => smIds.has(v.salesmanId));
    const planned = visits.length;
    const done = visits.filter((v) => v.done).length;
    const eff = visits.filter((v) => v.effective).length;
    const actual = visits.reduce((a, v) => a + v.value, 0);
    const target = sms.reduce((a, s) => a + (TARGETS[s.id] ?? 0), 0);
    const myOpps = opps.filter((o) => smIds.has(o.salesmanId));
    const open = myOpps.filter((o) => o.stage !== "Menang" && o.stage !== "Batal");
    const overdue = open.filter((o) => o.nextFollowUp && o.nextFollowUp < today).sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp));
    const perSales = sms.map((s) => {
      const v = visits.filter((x) => x.salesmanId === s.id);
      return { s, planned: v.length, done: v.filter((x) => x.done).length, eff: v.filter((x) => x.effective).length, actual: v.reduce((a, x) => a + x.value, 0), target: TARGETS[s.id] ?? 0 };
    });
    const perProduct = products.map((p) => ({ p, actual: visits.filter((v) => v.productId === p.id).reduce((a, v) => a + v.value, 0) }));
    return { visits, planned, done, eff, actual, target, myOpps, open, overdue, perSales, perProduct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVisits, hub, opps, salesmen, products, today]);

  const breakdown = hub === "all"
    ? HUBS.map((h) => { const r = d.perSales.filter((x) => x.s.hub === h); return { label: h, actual: r.reduce((a, x) => a + x.actual, 0), target: r.reduce((a, x) => a + x.target, 0) }; })
    : d.perSales.map((x) => ({ label: x.s.name, actual: x.actual, target: x.target }));
  const stageStats = STAGES.map((s) => { const l = d.myOpps.filter((o) => o.stage === s); return { s, count: l.length, value: l.reduce((a, o) => a + o.value, 0) }; });
  const maxStage = Math.max(1, ...stageStats.map((s) => s.value));
  const productTarget = d.target / products.length;
  const lowCompliance = [...d.perSales].filter((x) => x.planned).sort((a, b) => a.done / a.planned - b.done / b.planned).slice(0, 6);
  const draft = callplans.filter((c) => c.status === "Draft" && inHub(c.hub)).length;
  const approved = callplans.filter((c) => c.status === "Approved" && inHub(c.hub)).length;
  const activity = callplans.filter((c) => inHub(c.hub)).flatMap((c) => c.audit.map((a) => ({ ...a, cp: c }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`${hub === "all" ? "Semua Hub" : `Hub ${hub}`} · November 2026 · data per ${fmtDate(today)}`}
        action={<>
          <Badge variant="neutral">{sms.length} salesman</Badge>
          <Select value={hub} onValueChange={setHub}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Semua Hub</SelectItem>{HUBS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
          </Select>
        </>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard icon={Target} label="Target vs Aktual" value={`${pct(d.actual, d.target)}%`} hint={`${rupiahShort(d.actual)} dari ${rupiahShort(d.target)}`} />
        <StatCard icon={Footprints} tone="success" label="Kunjungan vs Rencana" value={`${pct(d.done, d.planned)}%`} hint={`${d.done} dari ${d.planned} call (callplan)`} />
        <StatCard icon={Zap} tone="orange" label="Effective Call Ratio" value={`${pct(d.eff, d.done)}%`} hint={`${d.eff} kunjungan dengan pesanan`} />
        <StatCard icon={GitBranch} label="Pipeline aktif" value={String(d.open.length)} hint={`${rupiahShort(d.open.reduce((a, o) => a + o.value, 0))} estimasi`} onClick={() => navigate("pipeline")} />
        <StatCard icon={AlarmClock} tone="danger" label="Follow-up terlambat" value={String(d.overdue.length)} hint="lewat tanggal follow-up" onClick={() => navigate("pipeline")} />
        <StatCard icon={CalendarClock} tone="warning" label="Callplan menunggu" value={String(draft + approved)} hint={`Draft ${draft} · Approved ${approved}`} onClick={() => navigate("callplan")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-base">Target vs aktual {hub === "all" ? "per Hub" : "per salesman"}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{breakdown.map((b) => <Bar key={b.label} label={b.label} actual={b.actual} target={b.target} />)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline per tahap</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stageStats.map((s) => (
              <div key={s.s} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant={STAGE_V[s.s]}>{s.s}</Badge>
                  <span className="text-xs text-muted-foreground"><b className="text-foreground">{s.count}</b> peluang · {rupiahShort(s.value)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
                  <div className={`h-full rounded-full ${s.s === "Batal" ? "bg-[#DC3545]" : s.s === "Menang" ? "bg-[#198754]" : "bg-primary"}`} style={{ width: `${(s.value / maxStage) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Target vs aktual per produk</CardTitle></CardHeader>
          <CardContent className="space-y-3">{d.perProduct.slice(0, 7).map((x) => <Bar key={x.p.id} label={x.p.name} actual={x.actual} target={productTarget} />)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Call compliance terendah</CardTitle></CardHeader>
          <CardContent className="p-0 pb-2">
            <Table>
              <TableHeader><TableRow><TableHead className="w-10">No.</TableHead><TableHead>Sales</TableHead><TableHead className="text-right">Visit</TableHead><TableHead className="text-right">EC</TableHead></TableRow></TableHeader>
              <TableBody>
                {lowCompliance.map((x, i) => (
                  <TableRow key={x.s.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><p className="font-medium">{x.s.name}</p><p className="text-xs text-muted-foreground">{x.s.hub}</p></TableCell>
                    <TableCell className="text-right">{x.done}/{x.planned} <span className="text-xs text-muted-foreground">({pct(x.done, x.planned)}%)</span></TableCell>
                    <TableCell className="text-right">{pct(x.eff, x.done)}%</TableCell>
                  </TableRow>
                ))}
                {!lowCompliance.length && <TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">Belum ada kunjungan dari callplan Published</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Follow-up terlambat</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!d.overdue.length && <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada follow-up terlambat</p>}
            {d.overdue.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{o.name}</p><p className="text-xs text-muted-foreground">{smName(o.salesmanId)} · {hubOf(o.salesmanId)} · {o.outletName}</p></div>
                <Badge variant="danger">{fmtDate(o.nextFollowUp)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Siklus callplan per Hub</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Hub</TableHead><TableHead>Siklus berjalan / terakhir</TableHead><TableHead>Siklus berikutnya</TableHead></TableRow></TableHeader>
              <TableBody>
                {HUBS.filter(inHub).map((h) => {
                  const mine = callplans.filter((c) => c.hub === h).sort((a, b) => a.startDate.localeCompare(b.startDate));
                  const cur = mine.find((c) => c.startDate <= today && today <= c.endDate) ?? [...mine].reverse().find((c) => c.endDate < today);
                  const next = mine.find((c) => c.startDate > today);
                  const cell = (c?: typeof cur) => c ? (
                    <button className="flex flex-wrap items-center gap-2 text-left hover:underline" onClick={() => navigate(`callplan/${c.id}`)}>
                      <span className="text-sm">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</span><StatusBadge s={c.status} />
                    </button>
                  ) : <span className="text-sm text-muted-foreground">Belum ada</span>;
                  return <TableRow key={h}><TableCell className="font-medium">{h}</TableCell><TableCell>{cell(cur)}</TableCell><TableCell>{cell(next)}</TableCell></TableRow>;
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Aktivitas callplan terakhir</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Callplan</TableHead><TableHead>Aksi</TableHead><TableHead>Oleh</TableHead></TableRow></TableHeader>
              <TableBody>
                {activity.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(a.at)}</TableCell>
                    <TableCell><button className="font-medium text-primary hover:underline" onClick={() => navigate(`callplan/${a.cp.id}`)}>{a.cp.id}</button></TableCell>
                    <TableCell><ActionBadge a={a.action} /></TableCell>
                    <TableCell className="text-sm">{a.by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Sumber kunjungan dan effective call: hasil kunjungan Mile Field dari callplan yang sudah Published (data dummy). Effective call = kunjungan dengan pesanan.</p>
    </div>
  );
}
