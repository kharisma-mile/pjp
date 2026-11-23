import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/store/app-store";
import type { OppStage } from "@/data/types";
import { fmtDate, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

const STAGES: OppStage[] = ["Prospek", "Dijadwalkan", "Negosiasi", "Menang", "Batal"];
const TOP: Record<OppStage, string> = { Prospek: "border-t-[#8F8F8F]", Dijadwalkan: "border-t-primary", Negosiasi: "border-t-[#FFC105]", Menang: "border-t-[#198754]", Batal: "border-t-[#DC3545]" };

export function PipelinePage() {
  const { opps, salesmen, moveOpp, addOpp, toast } = useApp();
  const [drag, setDrag] = useState<string | null>(null);
  const [add, setAdd] = useState(false);
  const [form, setForm] = useState({ name: "", outletName: "", salesmanId: "S1", value: "", nextFollowUp: "" });
  const salesName = (id: string) => salesmen.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <PageHeader title="Pipeline" subtitle="Peluang penjualan per tahap — geser kartu untuk pindah tahap" action={<Button onClick={() => setAdd(true)}><Plus /> Peluang baru</Button>} />
      <div className="mile-scroll flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((st) => {
          const list = opps.filter((o) => o.stage === st);
          return (
            <div key={st} className="w-64 shrink-0 rounded-md bg-muted p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag) { moveOpp(drag, st); toast({ tone: "success", title: `Dipindah ke ${st}` }); } setDrag(null); }}>
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-sm font-semibold">{st}</p>
                <span className="text-xs text-muted-foreground">{list.length} · {rupiah(list.reduce((n, o) => n + o.value, 0))}</span>
              </div>
              <div className="space-y-2">
                {list.map((o) => (
                  <Card key={o.id} draggable onDragStart={() => setDrag(o.id)} className={cn("cursor-grab border-t-4", TOP[st])}>
                    <CardContent className="space-y-1 p-3">
                      <p className="text-sm font-semibold">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.outletName} · {salesName(o.salesmanId)}</p>
                      <p className="text-sm font-medium">{rupiah(o.value)}</p>
                      <p className="text-xs text-muted-foreground">Follow-up {fmtDate(o.nextFollowUp)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={add} onOpenChange={setAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Peluang baru</DialogTitle></DialogHeader>
<div className="space-y-4 px-6 py-4">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Nama peluang</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Toko</Label><Input value={form.outletName} onChange={(e) => setForm({ ...form, outletName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Salesman</Label>
              <Select value={form.salesmanId} onValueChange={(v) => setForm({ ...form, salesmanId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{salesmen.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.hub}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nilai (Rp)</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Follow-up</Label><Input type="date" value={form.nextFollowUp} onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })} /></div>
            </div>
          </div>
</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdd(false)}>Batal</Button>
            <Button disabled={!form.name || !form.outletName} onClick={() => {
              addOpp({ name: form.name, outletName: form.outletName, salesmanId: form.salesmanId, value: Number(form.value) || 0, nextFollowUp: form.nextFollowUp, stage: "Prospek" });
              setAdd(false); setForm({ name: "", outletName: "", salesmanId: "S1", value: "", nextFollowUp: "" });
              toast({ tone: "success", title: "Peluang ditambahkan ke Prospek" });
            }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
