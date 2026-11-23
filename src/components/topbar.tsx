import { Check, ChevronDown, Repeat, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useApp } from "@/store/app-store";
import { initials } from "@/lib/format";

export function Topbar() {
  const { user, users, switchUser, resetDemo, toast } = useApp();
  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-background px-6">
      <p className="truncate text-xs text-muted-foreground">Izin aktif: <span className="font-medium text-foreground">{user.perms.join(", ")}</span></p>
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-md px-2 py-1 hover:bg-muted">
              <Avatar><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground"><Repeat className="h-3.5 w-3.5" /> Ganti user (demo)</DropdownMenuLabel>
            {users.map((u) => (
              <DropdownMenuItem key={u.id} onClick={() => { switchUser(u.id); toast({ title: `Sekarang sebagai ${u.name}`, desc: u.perms.join(", ") }); }}>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm">{u.name} · {u.role}</span>
                  <span className="text-xs text-muted-foreground">{u.perms.join(", ")}</span>
                </div>
                {u.id === user.id && <Check className="text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { resetDemo(); toast({ tone: "info", title: "Data demo direset" }); }}><RotateCcw /> Reset data demo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
