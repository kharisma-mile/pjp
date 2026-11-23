import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TONES = {
  primary: { bg: "bg-accent", fg: "text-primary" },
  success: { bg: "bg-[#D8F8E9]", fg: "text-[#198754]" },
  warning: { bg: "bg-[#FFF4D1]", fg: "text-[#9E7700]" },
  danger: { bg: "bg-[#FAE5E7]", fg: "text-[#BF2130]" },
  orange: { bg: "bg-[#FCEEE8]", fg: "text-[#E45C20]" },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  onClick?: () => void;
}) {
  const t = TONES[tone];
  return (
    <Card className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""} onClick={onClick}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${t.bg}`}>
          <Icon className={`h-5 w-5 ${t.fg}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground" title={label}>{label}</p>
          <p className="text-xl font-bold leading-tight text-foreground">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground" title={hint}>{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
