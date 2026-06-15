import type { ReactNode } from "react";
import { formatTokens } from "../usage-model";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone?: "blue" | "green" | "orange" | "slate";
}

export function MetricCard({ icon, label, value, detail, tone = "blue" }: MetricCardProps) {
  return (
    <section className={`metric-card tone-${tone}`}>
      <div className="metric-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p>{label}</p>
        <strong>{formatTokens(value)}</strong>
        <span>{detail}</span>
      </div>
    </section>
  );
}
