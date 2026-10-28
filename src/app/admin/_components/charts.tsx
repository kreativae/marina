"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PURPLE = "#800080";
const INK = "#0a0a0b";
const GRAPE = "#b266b2";
const GREY = "#a8a1aa";
const MIST = "#e3d3e4";

export const CHART_COLORS = [PURPLE, INK, GRAPE, GREY, MIST, "#5c005c"];

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgba(10,10,11,0.08)",
  fontSize: 12,
  background: "#fff",
  boxShadow: "0 10px 30px rgba(10,10,11,0.12)",
};

export function OriginBar({
  data,
}: {
  data: { name: string; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,11,0.06)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#a8a1aa" />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fontWeight: 600 }}
          width={82}
          stroke="#a8a1aa"
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(128,0,128,0.05)" }} />
        <Bar dataKey="total" name="Leads" radius={[0, 8, 8, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueBars({
  data,
}: {
  data: { month: string; mentoria: number; workshop: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,11,0.06)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} stroke="#a8a1aa" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#a8a1aa"
          tickFormatter={(v: number) => `${Math.round(v / 100)}€`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "rgba(128,0,128,0.05)" }}
          formatter={(value) => [`${(Number(value) / 100).toFixed(2)}€`, ""]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="mentoria" name="Mentoria" stackId="a" fill={INK} radius={[0, 0, 0, 0]} barSize={26} />
        <Bar dataKey="workshop" name="Workshop" stackId="a" fill={PURPLE} radius={[8, 8, 0, 0]} barSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActiveDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={[PURPLE, INK, GRAPE, GREY][i % 4]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={9} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ConversionBars({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,11,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} stroke="#a8a1aa" interval={0} angle={-18} textAnchor="end" height={52} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#a8a1aa" />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(128,0,128,0.05)" }} />
        <Bar dataKey="value" name="Deals" radius={[8, 8, 0, 0]} barSize={26}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i < 4 ? [MIST, GRAPE, PURPLE, "#5c005c"][i] : [INK, "#3a3a3c", GREY][i - 4] ?? GREY}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
