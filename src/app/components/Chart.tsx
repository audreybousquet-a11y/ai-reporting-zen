/**
 * Chart.tsx — Graphiques avec recharts + export PNG/Excel + plein écran + légende cliquable
 */
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from "recharts";

const COLORS = ["#3AA48A", "#2a7ab0", "#c47a20", "#d94040", "#6a8f88", "#4ec4a8", "#8ab8b0", "#2d8270"];

const Ico = ({ d, size = 14, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

interface ChartProps {
  data: Record<string, any>[];
  columns: string[];
  vizType: string;
  height?: number;
}

export default function Chart({ data, columns, vizType, height = 220 }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  if (!data || data.length === 0) return null;

  const isNum = (v: any) => typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "");
  const xCol = columns.find(c => !isNum(data[0][c])) || columns[0];
  const valueCols = columns.filter(c => c !== xCol && isNum(data[0][c]));
  if (valueCols.length === 0) return null;

  const chartData = data.slice(0, 20).map(row => {
    const d: Record<string, any> = { [xCol]: row[xCol] };
    valueCols.forEach(c => { d[c] = Number(row[c]) || 0; });
    return d;
  });

  const visibleCols = valueCols.filter(c => !hiddenSeries.has(c));

  // Toggle série au clic sur la légende
  const handleLegendClick = useCallback((o: any) => {
    const key = o?.dataKey || o?.value || o?.payload?.dataKey;
    if (!key) return;
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // Export PNG
  const exportPNG = () => {
    const svgEl = chartRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "graphique-aria.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Export Excel (.xlsx)
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(chartData, { header: [xCol, ...valueCols] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, "donnees-aria.xlsx");
  };

  const h = fullscreen ? window.innerHeight - 120 : "100%";

  const legendProps = {
    wrapperStyle: { fontSize: 11, cursor: "pointer" },
    layout: "vertical" as const,
    align: "right" as const,
    verticalAlign: "middle" as const,
    onClick: handleLegendClick,
    formatter: (value: string) => (
      <span style={{ color: hiddenSeries.has(value) ? "#d0e8e2" : "#1a3030", textDecoration: hiddenSeries.has(value) ? "line-through" : "none" }}>
        {value}
      </span>
    ),
  };

  const renderChart = () => {
    // PIE — le clic légende masque des tranches (pas des séries)
    if (vizType === "pie" || vizType === "camembert") {
      const valueCol = visibleCols[0] || valueCols[0];
      const pieData = chartData.filter(d => !hiddenSeries.has(String(d[xCol])));
      return (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={pieData} dataKey={valueCol} nameKey={xCol} cx="50%" cy="50%" outerRadius={typeof h === "number" ? h / 3 : 80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}
            >
              {pieData.map((d, i) => {
                const origIdx = chartData.findIndex(cd => cd[xCol] === d[xCol]);
                return <Cell key={i} fill={COLORS[origIdx % COLORS.length]} />;
              })}
            </Pie>
            <Tooltip formatter={(v: number) => v.toLocaleString("fr-FR")} />
            <Legend
              wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
              layout="vertical" align="right" verticalAlign="middle"
              payload={chartData.map((d, i) => ({
                value: String(d[xCol]),
                type: "square" as const,
                color: COLORS[i % COLORS.length],
                inactive: hiddenSeries.has(String(d[xCol])),
              }))}
              onClick={(o: any) => {
                const key = o?.value;
                if (!key) return;
                setHiddenSeries(prev => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  return next;
                });
              }}
              formatter={(value: string) => (
                <span style={{ color: hiddenSeries.has(value) ? "#d0e8e2" : "#1a3030", textDecoration: hiddenSeries.has(value) ? "line-through" : "none" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // LINE
    if (vizType === "line" || vizType === "ligne" || vizType === "area") {
      return (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8f4f1" />
            <XAxis dataKey={xCol} tick={{ fontSize: 11, fill: "#4a7068" }} />
            <YAxis tick={{ fontSize: 11, fill: "#4a7068" }} />
            <Tooltip formatter={(v: number) => v.toLocaleString("fr-FR")} />
            <Legend {...legendProps} />
            {valueCols.filter(col => !hiddenSeries.has(col)).map((col) => (
              <Line key={col} type="monotone" dataKey={col} stroke={COLORS[valueCols.indexOf(col) % COLORS.length]} strokeWidth={2} dot={{ r: 4 }}>
                {chartData.length <= 20 && (
                  <LabelList dataKey={col} position="top" fontSize={10} fill="#4a7068" offset={8}
                    formatter={(v: number) => typeof v === "number" ? v.toLocaleString("fr-FR") : v} />
                )}
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // BAR
    return (
      <ResponsiveContainer width="100%" height={h}>
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
          <Legend {...legendProps} />
          {valueCols.filter(col => !hiddenSeries.has(col)).map((col, i) => (
            <Bar key={col} dataKey={col} fill={COLORS[valueCols.indexOf(col) % COLORS.length]} radius={[4, 4, 0, 0]}>
              {chartData.length <= 20 && (
                <LabelList dataKey={col} position="top" fontSize={10} fill="#4a7068"
                  formatter={(v: number) => typeof v === "number" ? v.toLocaleString("fr-FR") : v} />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Boutons toolbar
  const toolbar = (
    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginBottom: 6 }}>
      <button onClick={exportExcel} title="Exporter en Excel"
        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d0e8e2", background: "#fff", cursor: "pointer", fontSize: 11, color: "#4a7068", display: "flex", alignItems: "center", gap: 4 }}
      >
        <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" size={12} /> Excel
      </button>
      <button onClick={exportPNG} title="Exporter en image"
        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d0e8e2", background: "#fff", cursor: "pointer", fontSize: 11, color: "#4a7068", display: "flex", alignItems: "center", gap: 4 }}
      >
        <Ico d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={12} /> PNG
      </button>
      <button onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? "Quitter plein écran" : "Plein écran"}
        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d0e8e2", background: "#fff", cursor: "pointer", fontSize: 11, color: "#4a7068", display: "flex", alignItems: "center", gap: 4 }}
      >
        <Ico d={fullscreen ? "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" : "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"} size={12} />
        {fullscreen ? "Réduire" : "Agrandir"}
      </button>
    </div>
  );

  // Plein écran
  if (fullscreen) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 200, padding: 24, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a3030" }}>Graphique</span>
          {toolbar}
        </div>
        <div ref={chartRef} style={{ flex: 1 }}>
          {renderChart()}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: height }}>
      {toolbar}
      <div ref={chartRef} style={{ flex: 1, minHeight: 0 }}>
        {renderChart()}
      </div>
    </div>
  );
}
