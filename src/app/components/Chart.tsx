/**
 * Chart.tsx — Rendu graphiques (bar, line, pie) avec recharts
 */
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#3AA48A", "#2a7ab0", "#c47a20", "#d94040", "#6a8f88", "#4ec4a8", "#8ab8b0", "#2d8270"];

interface ChartProps {
  data: Record<string, any>[];
  columns: string[];
  vizType: string; // bar, hbar, line, pie, area
  height?: number;
}

export default function Chart({ data, columns, vizType, height = 220 }: ChartProps) {
  if (!data || data.length === 0) return null;

  // Détecter les colonnes : la première non-numérique = axe X, les numériques = valeurs
  const isNum = (v: any) => typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "");
  const xCol = columns.find(c => !isNum(data[0][c])) || columns[0];
  const valueCols = columns.filter(c => c !== xCol && isNum(data[0][c]));

  if (valueCols.length === 0) return null;

  // Préparer les données (limiter à 20 pour lisibilité)
  const chartData = data.slice(0, 20).map(row => {
    const d: Record<string, any> = { [xCol]: row[xCol] };
    valueCols.forEach(c => { d[c] = Number(row[c]) || 0; });
    return d;
  });

  // PIE
  if (vizType === "pie" || vizType === "camembert") {
    const valueCol = valueCols[0];
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={valueCol}
            nameKey={xCol}
            cx="50%"
            cy="50%"
            outerRadius={height / 3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
            fontSize={11}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString("fr-FR")} />
          <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // LINE
  if (vizType === "line" || vizType === "ligne" || vizType === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8f4f1" />
          <XAxis dataKey={xCol} tick={{ fontSize: 11, fill: "#4a7068" }} />
          <YAxis tick={{ fontSize: 11, fill: "#4a7068" }} />
          <Tooltip formatter={(v: number) => v.toLocaleString("fr-FR")} />
          {valueCols.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" />}
          {valueCols.map((col, i) => (
            <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // BAR (défaut)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout={vizType === "hbar" ? "vertical" : "horizontal"}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8f4f1" />
        {vizType === "hbar" ? (
          <>
            <YAxis dataKey={xCol} type="category" tick={{ fontSize: 11, fill: "#4a7068" }} width={100} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#4a7068" }} />
          </>
        ) : (
          <>
            <XAxis dataKey={xCol} tick={{ fontSize: 11, fill: "#4a7068" }} />
            <YAxis tick={{ fontSize: 11, fill: "#4a7068" }} />
          </>
        )}
        <Tooltip formatter={(v: number) => v.toLocaleString("fr-FR")} />
        {valueCols.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} layout="vertical" align="right" verticalAlign="middle" />}
        {valueCols.map((col, i) => (
          <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
