import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border",
        // status label capsules (MileApp light backgrounds)
        info: "border-transparent bg-accent text-accent-foreground",
        success: "border-transparent bg-[#D8F8E9] text-[#115A38]",
        warning: "border-transparent bg-[#FFF4D1] text-[#6B5000]",
        danger: "border-transparent bg-[#FAE5E7] text-[#68121A]",
        neutral: "border-transparent bg-[#E8E8E8] text-[#4F4F4F]",
        orange: "border-transparent bg-[#FCEEE8] text-[#BA4917]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
