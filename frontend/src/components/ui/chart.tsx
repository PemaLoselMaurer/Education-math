"use client";
import React, { useContext } from "react";
import { Tooltip } from "recharts";

export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartContext = React.createContext<ChartConfig | null>(null);

type CSSVarStyle = React.CSSProperties & { [key: `--color-${string}`]: string };

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactNode;
}) {
  const styleVars = {} as CSSVarStyle;
  Object.entries(config).forEach(([key, value]) => {
    styleVars[`--color-${key}`] = value.color;
  });
  return (
    <ChartContext.Provider value={config}>
      <div className={className} style={styleVars}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

type RechartsTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
    color?: string;
  }>;
};

export function ChartTooltipContent(
  props: RechartsTooltipProps & { indicator?: "line" | "dot" }
) {
  const cfg = useContext(ChartContext);
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0] || {};
  const seriesKey = (item.dataKey as string) || "value";
  const color = cfg?.[seriesKey]?.color || (item.color as string) || "#8884d8";
  const raw = item.value as number | string | undefined;
  const value = typeof raw === "number" ? raw : raw ?? undefined;
  return (
    <div className="rounded-md border bg-white/95 px-3 py-2 text-xs shadow">
      <div className="font-medium text-gray-700 mb-0.5">{label}</div>
      <div className="flex items-center gap-2 text-gray-600">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{cfg?.[seriesKey]?.label || seriesKey}:</span>
        <span className="font-semibold text-gray-800">{value ?? "-"}</span>
      </div>
    </div>
  );
}

export { Tooltip as ChartTooltip };
