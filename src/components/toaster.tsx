import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

const TONE = {
  success: { icon: CheckCircle2, cls: "text-[#198754]", bar: "bg-[#198754]" },
  info: { icon: Info, cls: "text-primary", bar: "bg-primary" },
  warning: { icon: TriangleAlert, cls: "text-[#9E7700]", bar: "bg-[#FFC105]" },
  danger: { icon: XCircle, cls: "text-[#DC3545]", bar: "bg-[#DC3545]" },
};

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[380px] max-w-[calc(100vw-32px)] flex-col gap-2">
      {toasts.map((t) => {
        const tone = TONE[t.tone ?? "info"];
        const Icon = tone.icon;
        return (
          <div key={t.id} className="pointer-events-auto relative flex gap-3 overflow-hidden rounded-md border border-border bg-background p-4 pl-5 shadow-lg animate-in slide-in-from-bottom-2 fade-in-0">
            <span className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tone.cls)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.desc && <p className="text-xs text-muted-foreground">{t.desc}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
