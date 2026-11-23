import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApp } from "@/store/app-store";
import { rupiah } from "@/lib/format";

function MasterTable<T>({ title, subtitle, rows, cols, text }: { title: string; subtitle: string; rows: T[]; cols: { h: string; c: (r: T) => ReactNode }[]; text: (r: T) => string }) {
  const [q, setQ] = useState("");
  const list = rows.filter((r) => text(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cari..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow>{cols.map((c) => <TableHead key={c.h}>{c.h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {list.map((r, i) => <TableRow key={i}>{cols.map((c) => <TableCell key={c.h}>{c.c(r)}</TableCell>)}</TableRow>)}
            {!list.length && <TableRow><TableCell colSpan={cols.length} className="py-8 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export function ProductsPage() {
  const { products } = useApp();
  return <MasterTable title="Product" subtitle="Master produk (referensi)" rows={products} text={(p) => p.sku + p.name + p.category}
    cols={[{ h: "SKU", c: (p) => p.sku }, { h: "Nama", c: (p) => <span className="font-medium">{p.name}</span> }, { h: "Kategori", c: (p) => p.category }, { h: "UoM", c: (p) => p.uom }, { h: "Harga", c: (p) => rupiah(p.price) }]} />;
}

export function OutletsPage() {
  const { outlets } = useApp();
  return <MasterTable title="Outlet" subtitle="Nama toko di file import callplan harus sama dengan nama di sini, dan Hub-nya harus sesuai" rows={outlets} text={(o) => o.name + o.hub + o.address}
    cols={[{ h: "ID", c: (o) => o.id }, { h: "Toko", c: (o) => <span className="font-medium">{o.name}</span> }, { h: "Hub", c: (o) => o.hub }, { h: "Pemilik", c: (o) => o.owner }, { h: "Alamat", c: (o) => o.address }]} />;
}

export function SalesmenPage() {
  const { salesmen } = useApp();
  return <MasterTable title="Salesman" subtitle="Nama salesman di file import callplan harus sama dengan nama di sini, dan Hub-nya harus sesuai" rows={salesmen} text={(s) => s.name + s.hub}
    cols={[{ h: "ID", c: (s) => s.id }, { h: "Nama", c: (s) => <span className="font-medium">{s.name}</span> }, { h: "Hub", c: (s) => s.hub }, { h: "Telepon", c: (s) => s.phone }]} />;
}
