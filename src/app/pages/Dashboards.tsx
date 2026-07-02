/**
 * Dashboards.tsx — Tableaux de bord avec drag & drop
 */
import { useState, useRef, useEffect } from "react";
import { Favori, AskResult, ask } from "../lib/api";
import Chart from "../components/Chart";

import type { SavedFavori } from "../AriaApp";

interface DashboardsProps {
  id_magasin: string;
  user_id: string;
  savedFavoris?: SavedFavori[];
  onNavigate?: (page: string) => void;
  onSetQuestion?: (question: string) => void;
  onDeleteFavori?: (idx: number) => void;
  onEditFavori?: (idx: number, titre: string, cat: string) => void;
}

// Icônes SVG
const Ico = ({ d, size = 16, color = "currentColor" }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

// Favoris démo (en attendant l'API)
// Icônes SVG par type de visuel
const vizIcons: Record<string, string> = {
  tableau: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  barres: "M18 20V10M12 20V4M6 20v-6",
  ligne: "M22 12h-4l-3 9L9 3l-3 9H2",
  camembert: "M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z",
  kpi: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
};

const DEMO_FAVORIS: (Favori & { cat: string; viz: string })[] = [
  { titre: "Heures par salarié et semaine", question: "heures par salarié et semaine ce mois", sql: "", viz_config: {}, cat: "equipe", viz: "tableau" },
  { titre: "Heures par activité", question: "heures par activité ce mois", sql: "", viz_config: {}, cat: "equipe", viz: "camembert" },
  { titre: "Cagnotte heures sup", question: "cagnotte heures sup par salarié", sql: "", viz_config: {}, cat: "equipe", viz: "tableau" },
  { titre: "Coût de revient par salarié", question: "coût de revient par salarié ce mois", sql: "", viz_config: {}, cat: "equipe", viz: "barres" },
  { titre: "Heures par chantier", question: "heures par chantier ce mois", sql: "", viz_config: {}, cat: "chantier", viz: "barres" },
  { titre: "Top 10 clients", question: "top 10 clients par heures cette année", sql: "", viz_config: {}, cat: "chantier", viz: "barres" },
  { titre: "Absences par motif", question: "répartition des absences par motif cette année", sql: "", viz_config: {}, cat: "absence", viz: "camembert" },
  { titre: "Congés par salarié", question: "congés par salarié et par an", sql: "", viz_config: {}, cat: "absence", viz: "barres" },
  { titre: "Rentabilité chantier", question: "rentabilité par chantier ce mois", sql: "", viz_config: {}, cat: "chantier", viz: "tableau" },
  { titre: "Évolution heures par mois", question: "heures travaillées par mois cette année", sql: "", viz_config: {}, cat: "equipe", viz: "ligne" },
  { titre: "Salariés actifs", question: "combien de salariés actifs", sql: "", viz_config: {}, cat: "equipe", viz: "kpi" },
  { titre: "Heures ce mois", question: "total heures travaillées ce mois", sql: "", viz_config: {}, cat: "equipe", viz: "kpi" },
  { titre: "Coût de revient", question: "coût de revient total ce mois", sql: "", viz_config: {}, cat: "equipe", viz: "kpi" },
  { titre: "Absents ce mois", question: "combien de salariés absents ce mois", sql: "", viz_config: {}, cat: "absence", viz: "kpi" },
];

const FILTER_CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "equipe", label: "Équipe & RH" },
  { id: "chantier", label: "Chantiers" },
  { id: "absence", label: "Absences" },
  { id: "finance", label: "Finances" },
  { id: "general", label: "Général" },
];

const EDIT_CATEGORIES = [
  { id: "equipe", label: "Équipe & RH" },
  { id: "chantier", label: "Chantiers" },
  { id: "absence", label: "Absences" },
  { id: "finance", label: "Finances" },
  { id: "general", label: "Général" },
];

type CellSize = "small" | "medium" | "large"; // 1/4, 1/2, full width

interface DashboardData {
  id: string;
  nom: string;
  cells: (CellData | null)[];
  sizes: CellSize[];
}

interface CellData {
  titre: string;
  question: string;
  result?: AskResult;
  loading?: boolean;
}

export default function Dashboards({ id_magasin, user_id, savedFavoris = [], onNavigate, onSetQuestion, onDeleteFavori, onEditFavori }: DashboardsProps) {
  const [dashboards, setDashboards] = useState<DashboardData[]>([
    { id: "db1", nom: "Suivi équipe", cells: [null, null, null, null], sizes: ["medium", "medium", "medium", "medium"] },
  ]);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [activeDb, setActiveDb] = useState("db1");
  const [catFilter, setCatFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dragFavRef = useRef<string | null>(null);
  const dragCellRef = useRef<number | null>(null);
  const dragWithZone = useRef(false); // ctrl+drag = déplace la zone entière
  const [editingFav, setEditingFav] = useState<{ idx: number; question: string; titre: string; cat: string } | null>(null);

  const db = dashboards.find(d => d.id === activeDb)!;

  // Fusionner démo + favoris sauvegardés
  const allFavoris = [
    ...DEMO_FAVORIS,
    ...savedFavoris.map(f => ({ titre: f.titre, question: f.question, sql: f.sql, viz_config: f.viz_config, cat: f.cat, viz: f.viz })),
  ];
  const filteredFavs = allFavoris.filter(f => catFilter === "all" || f.cat === catFilter);

  // Exécuter un favori et mettre le résultat dans une cellule
  const executeInCell = async (cellIdx: number, titre: string, question: string) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== activeDb) return d;
      const cells = [...d.cells];
      cells[cellIdx] = { titre, question, loading: true };
      return { ...d, cells };
    }));

    try {
      const result = await ask(question, id_magasin, user_id);
      setDashboards(prev => prev.map(d => {
        if (d.id !== activeDb) return d;
        const cells = [...d.cells];
        cells[cellIdx] = { titre, question, result, loading: false };
        return { ...d, cells };
      }));
    } catch {
      setDashboards(prev => prev.map(d => {
        if (d.id !== activeDb) return d;
        const cells = [...d.cells];
        cells[cellIdx] = { titre, question, loading: false };
        return { ...d, cells };
      }));
    }
  };

  const removeCell = (idx: number) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== activeDb) return d;
      const cells = [...d.cells];
      cells[idx] = null;
      return { ...d, cells };
    }));
  };

  const swapCells = (from: number, to: number) => {
    setDashboards(prev => prev.map(d => {
      if (d.id !== activeDb) return d;
      const cells = [...d.cells];
      const sizes = [...(d.sizes || [])];
      if (dragWithZone.current) {
        // Ctrl+drag : swap contenu + taille (déplace la zone entière)
        [cells[from], cells[to]] = [cells[to], cells[from]];
        [sizes[from], sizes[to]] = [sizes[to], sizes[from]];
      } else {
        // Drag normal : swap juste le contenu, zones restent en place
        [cells[from], cells[to]] = [cells[to], cells[from]];
      }
      return { ...d, cells, sizes };
    }));
  };

  const renameDashboard = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, nom: newName.trim() } : d));
    setEditingTabId(null);
  };

  const deleteDashboard = (id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id));
    if (activeDb === id) {
      const remaining = dashboards.filter(d => d.id !== id);
      setActiveDb(remaining[0]?.id || "");
    }
    setConfirmDelete(null);
  };

  const createDashboard = () => {
    const id = "db_" + Date.now();
    const nom = newDbName.trim() || "Nouveau dashboard";
    setDashboards(prev => [...prev, { id, nom, cells: [null, null, null, null], sizes: ["medium", "medium", "medium", "medium"] }]);
    setActiveDb(id);
    setShowNewModal(false);
    setNewDbName("");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
            <Ico d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" size={22} color="#3AA48A" />
            Dashboards
          </h2>
          <p style={{ color: "#4a7068", fontSize: 13 }}>Glissez des favoris dans les zones pour composer vos tableaux de bord</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#3AA48A", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Ico d="M12 5v14M5 12h14" size={14} color="#fff" /> Nouveau dashboard
        </button>
      </div>

      {/* Bandeau favoris */}
      <div style={{ background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8ab8b0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Favoris — glissez dans le dashboard
        </div>
        {/* Boutons catégorie */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {FILTER_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                border: `2px solid ${catFilter === c.id ? "#3AA48A" : "#d0e8e2"}`,
                background: catFilter === c.id ? "#3AA48A" : "#fff",
                color: catFilter === c.id ? "#fff" : "#4a7068",
                cursor: "pointer", transition: "all .15s",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        {/* Chips favoris */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filteredFavs.map((fav, i) => {
            const realIdx = allFavoris.indexOf(fav);
            return (
            <div
              key={i}
              draggable
              onDragStart={() => { dragFavRef.current = fav.question; }}
              onDragEnd={() => { dragFavRef.current = null; }}
              onDoubleClick={() => setEditingFav({ idx: realIdx, question: fav.question, titre: fav.titre, cat: fav.cat })}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
                background: "#f0f7f5", border: "1.5px solid #d0e8e2", fontSize: 12, fontWeight: 500,
                color: "#1a3030", cursor: "grab", transition: "all .15s", whiteSpace: "nowrap",
              }}
              onMouseOver={e => { (e.currentTarget).style.borderColor = "#3AA48A"; (e.currentTarget).style.background = "#e8f4f1"; }}
              onMouseOut={e => { (e.currentTarget).style.borderColor = "#d0e8e2"; (e.currentTarget).style.background = "#f0f7f5"; }}
            >
              <Ico d={vizIcons[fav.viz] || vizIcons.tableau} size={13} color="#3AA48A" />
              {fav.titre}
            </div>
            );
          })}
        </div>
      </div>

      {/* Onglets dashboards */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f0f7f5", padding: 4, borderRadius: 10, width: "fit-content", alignItems: "center" }}>
        {dashboards.map(d => (
          <div
            key={d.id}
            onClick={() => setActiveDb(d.id)}
            onDoubleClick={() => { setEditingTabId(d.id); setEditingTabName(d.nom); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: activeDb === d.id ? 600 : 500,
              background: activeDb === d.id ? "#fff" : "transparent",
              color: activeDb === d.id ? "#1a3030" : "#4a7068",
              cursor: "pointer", position: "relative",
              boxShadow: activeDb === d.id ? "0 1px 4px rgba(0,0,0,.06)" : "none",
            }}
          >
            {editingTabId === d.id ? (
              <input
                value={editingTabName}
                onChange={e => setEditingTabName(e.target.value)}
                onBlur={() => renameDashboard(d.id, editingTabName)}
                onKeyDown={e => { if (e.key === "Enter") renameDashboard(d.id, editingTabName); if (e.key === "Escape") setEditingTabId(null); }}
                autoFocus
                onClick={e => e.stopPropagation()}
                style={{ border: "1px solid #3AA48A", borderRadius: 4, padding: "2px 6px", fontSize: 13, fontFamily: "inherit", outline: "none", width: 120, color: "#1a3030" }}
              />
            ) : (
              <span>{d.nom}</span>
            )}
            {dashboards.length > 1 && (
              <span
                onClick={e => { e.stopPropagation(); setConfirmDelete(d.id); }}
                style={{ fontSize: 11, color: "#8ab8b0", cursor: "pointer", marginLeft: 2, opacity: 0.5, transition: "opacity .15s" }}
                onMouseOver={e => { (e.currentTarget).style.opacity = "1"; (e.currentTarget).style.color = "#d94040"; }}
                onMouseOut={e => { (e.currentTarget).style.opacity = "0.5"; (e.currentTarget).style.color = "#8ab8b0"; }}
              >✕</span>
            )}
          </div>
        ))}
      </div>

      {/* Grille du dashboard — tailles dynamiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, minHeight: 300 }}>
        {db.cells.map((cell, idx) => {
          const size = db.sizes?.[idx] || "medium";
          const span = size === "small" ? 1 : size === "medium" ? 2 : 4;
          return cell ? (
            /* Cellule remplie */
            <div
              key={idx}
              draggable
              onDragStart={(e) => { dragCellRef.current = idx; dragWithZone.current = e.ctrlKey; }}
              onDragEnd={() => { dragCellRef.current = null; dragWithZone.current = false; }}
              onDragOver={e => { e.preventDefault(); (e.currentTarget).style.border = "2px solid #3AA48A"; }}
              onDragLeave={e => { (e.currentTarget).style.border = "1px solid #d0e8e2"; }}
              onDrop={e => {
                e.preventDefault();
                (e.currentTarget).style.border = "1px solid #d0e8e2";
                if (dragCellRef.current !== null && dragCellRef.current !== idx) {
                  swapCells(dragCellRef.current, idx);
                }
              }}
              style={{
                background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, overflow: "hidden", cursor: "grab", transition: "border .2s",
                display: "flex", flexDirection: "column", gridColumn: `span ${span}`,
                alignSelf: (cell.result?.data?.length === 1 && (cell.result?.columns?.length || 0) <= 2) ? "start" : "stretch",
              }}
            >
              {/* Header cellule */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e8f4f1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#1a3030" }}>
                  <span style={{ color: "#8ab8b0", cursor: "grab", fontSize: 12 }} title="Glisser pour déplacer (Ctrl = déplacer la zone entière)">⠿</span>
                  {cell.titre}
                  <span style={{ fontSize: 10, color: "#d0e8e2", marginLeft: 4 }}>
                    {(db.sizes?.[idx] || "medium") === "small" ? "1/4" : (db.sizes?.[idx] || "medium") === "large" ? "100%" : "1/2"}
                  </span>
                </div>
                <button
                  onClick={() => removeCell(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8ab8b0", fontSize: 14 }}
                >✕</button>
              </div>
              {/* Body cellule */}
              <div style={{ padding: 14, height: cell.result?.data?.length === 1 && cell.result?.columns?.length <= 2 ? "auto" : 320, overflow: "auto", display: "flex", flexDirection: "column" }}>
                {cell.loading ? (
                  <div style={{ textAlign: "center", padding: 30, color: "#8ab8b0" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <p style={{ marginTop: 8, fontSize: 12 }}>Chargement...</p>
                  </div>
                ) : cell.result?.data && cell.result.data.length > 0 ? (
                  (() => {
                    // KPI : 1 seule ligne, 1-2 colonnes → gros chiffre centré
                    if (cell.result!.data.length === 1 && cell.result!.columns.length <= 2) {
                      const lastCol = cell.result!.columns[cell.result!.columns.length - 1];
                      const val = cell.result!.data[0][lastCol];
                      return (
                        <div style={{ textAlign: "center", padding: 24 }}>
                          <div style={{ fontSize: 40, fontWeight: 800, color: "#3AA48A", fontVariantNumeric: "tabular-nums" }}>
                            {typeof val === "number" ? val.toLocaleString("fr-FR") : val}
                          </div>
                          <div style={{ fontSize: 12, color: "#4a7068", marginTop: 6 }}>{lastCol.replace(/_/g, " ")}</div>
                        </div>
                      );
                    }
                    // Graphique ou tableau
                    let vt = cell.result!.viz_config?.type_viz || "table";
                    const row0 = cell.result!.data[0] || {};
                    const cols = cell.result!.columns;
                    const isDim = (c: string, v: any) => {
                      if (typeof v === "string") return true;
                      const nm = c.toLowerCase();
                      if (["mois", "semaine", "annee", "année", "periode", "jour", "trimestre"].includes(nm)) return true;
                      return false;
                    };
                    const dimCols = cols.filter(c => isDim(c, row0[c]));
                    const numCols = cols.filter(c => !isDim(c, row0[c]) && (typeof row0[c] === "number" || !isNaN(Number(row0[c]))));
                    const n = cell.result!.data.length;
                    if (vt === "pivot" && n <= 10) vt = n <= 8 ? "pie" : "bar";
                    if (vt === "table" && dimCols.length === 1 && numCols.length >= 1 && n <= 20) {
                      const dm = dimCols[0].toLowerCase();
                      if (["mois", "semaine", "trimestre"].includes(dm) || dm.includes("mois") || dm.includes("date")) vt = "line";
                      else if (n <= 8 && numCols.length === 1) vt = "pie";
                      else vt = "bar";
                    }
                    const isChart = ["bar", "hbar", "line", "pie", "area"].includes(vt);
                    return isChart ? (
                      <Chart data={cell.result!.data} columns={cell.result!.columns} vizType={vt} height={180} />
                    ) : (
                      <table className="dtable" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>{cell.result!.columns.map(c => <th key={c} className={typeof cell.result!.data[0]?.[c] === "number" ? "n" : ""}>{c}</th>)}</tr>
                        </thead>
                        <tbody>
                          {cell.result!.data.map((row, ri) => (
                            <tr key={ri}>
                              {cell.result!.columns.map(c => (
                                <td key={c} className={typeof row[c] === "number" ? "n" : ""}>
                                  {typeof row[c] === "number" ? row[c].toLocaleString("fr-FR") : row[c]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()
                ) : (
                  <p style={{ color: "#8ab8b0", fontSize: 12, textAlign: "center", padding: 20 }}>
                    {cell.result?.error || "Aucun résultat"}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Zone drop vide */
            <div
              key={idx}
              draggable
              onDragStart={(e) => { dragCellRef.current = idx; dragWithZone.current = e.ctrlKey; }}
              onDragEnd={() => { dragCellRef.current = null; dragWithZone.current = false; }}
              onDragOver={e => { e.preventDefault(); (e.currentTarget).style.borderColor = "#3AA48A"; (e.currentTarget).style.background = "#e8f4f1"; (e.currentTarget).style.color = "#3AA48A"; }}
              onDragLeave={e => { (e.currentTarget).style.borderColor = "#d0e8e2"; (e.currentTarget).style.background = "transparent"; (e.currentTarget).style.color = "#8ab8b0"; }}
              onDrop={e => {
                e.preventDefault();
                (e.currentTarget).style.borderColor = "#d0e8e2";
                (e.currentTarget).style.background = "transparent";
                (e.currentTarget).style.color = "#8ab8b0";
                if (dragFavRef.current) {
                  const fav = allFavoris.find(f => f.question === dragFavRef.current);
                  if (fav) executeInCell(idx, fav.titre, fav.question);
                }
                if (dragCellRef.current !== null && dragCellRef.current !== idx) {
                  swapCells(dragCellRef.current, idx);
                }
              }}
              style={{
                border: "2px dashed #d0e8e2", borderRadius: 12, minHeight: size === "small" ? 100 : 200, position: "relative",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 6, color: "#8ab8b0", fontSize: 13, transition: "all .2s", cursor: "grab",
                gridColumn: `span ${span}`,
              }}
            >
              <Ico d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" size={28} color="#d0e8e2" />
              Glissez un favori ici
              {db.cells.length > 1 && (
                <span
                  onClick={() => setDashboards(prev => prev.map(d => d.id !== activeDb ? d : { ...d, cells: d.cells.filter((_, ci) => ci !== idx), sizes: (d.sizes || []).filter((_, ci) => ci !== idx) }))}
                  style={{ position: "absolute", top: 6, right: 8, fontSize: 12, color: "#d0e8e2", cursor: "pointer", opacity: 0.5, transition: "all .15s" }}
                  onMouseOver={e => { (e.currentTarget).style.opacity = "1"; (e.currentTarget).style.color = "#d94040"; }}
                  onMouseOut={e => { (e.currentTarget).style.opacity = "0.5"; (e.currentTarget).style.color = "#d0e8e2"; }}
                >✕</span>
              )}
            </div>
          );
        })}
        {/* Bouton ajouter une zone avec choix de taille */}
        <div style={{ gridColumn: "span 4", position: "relative" }}>
          <div
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            style={{
              border: "2px dashed #d0e8e2", borderRadius: 12, padding: "16px 0",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, color: "#8ab8b0", fontSize: 13, cursor: "pointer", transition: "all .2s",
            }}
            onMouseOver={e => { (e.currentTarget).style.borderColor = "#3AA48A"; (e.currentTarget).style.color = "#3AA48A"; }}
            onMouseOut={e => { (e.currentTarget).style.borderColor = "#d0e8e2"; (e.currentTarget).style.color = "#8ab8b0"; }}
          >
            <Ico d="M12 5v14M5 12h14" size={18} color="currentColor" />
            Ajouter une zone
          </div>
          {showSizeMenu && (
            <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 6, background: "#fff", border: "1px solid #d0e8e2", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,.1)", padding: 8, display: "flex", gap: 6, zIndex: 10 }}>
              {([
                { size: "small" as CellSize, label: "Petite (KPI)", desc: "1/4" },
                { size: "medium" as CellSize, label: "Moyenne", desc: "1/2" },
                { size: "large" as CellSize, label: "Grande", desc: "Pleine largeur" },
              ]).map(opt => (
                <button key={opt.size}
                  onClick={() => {
                    setDashboards(prev => prev.map(d => d.id !== activeDb ? d : { ...d, cells: [...d.cells, null], sizes: [...(d.sizes || []), opt.size] }));
                    setShowSizeMenu(false);
                  }}
                  style={{
                    padding: "10px 16px", borderRadius: 8, border: "1.5px solid #d0e8e2", background: "#fff",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "center", transition: "all .15s",
                    minWidth: 100,
                  }}
                  onMouseOver={e => { (e.currentTarget).style.borderColor = "#3AA48A"; (e.currentTarget).style.background = "#e8f4f1"; }}
                  onMouseOut={e => { (e.currentTarget).style.borderColor = "#d0e8e2"; (e.currentTarget).style.background = "#fff"; }}
                >
                  <div style={{ fontWeight: 600, color: "#1a3030" }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: "#8ab8b0", marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal édition favori */}
      {editingFav && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,48,48,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setEditingFav(null)}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a3030", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Ico d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={18} color="#3AA48A" />
              Modifier le favori
            </h3>

            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1a3030" }}>Nom</label>
            <input
              type="text"
              value={editingFav.titre}
              onChange={e => setEditingFav({ ...editingFav, titre: e.target.value })}
              autoFocus
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #3AA48A", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 12, color: "#1a3030" }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1a3030" }}>Question</label>
            <div style={{ padding: "10px 14px", border: "1px solid #d0e8e2", borderRadius: 10, fontSize: 13, color: "#4a7068", marginBottom: 16, background: "#f0f7f5" }}>
              {editingFav.question}
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8, color: "#1a3030" }}>Catégorie</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {EDIT_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setEditingFav({ ...editingFav, cat: c.id })}
                  style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    border: `2px solid ${editingFav.cat === c.id ? "#3AA48A" : "#d0e8e2"}`,
                    background: editingFav.cat === c.id ? "#3AA48A" : "#fff",
                    color: editingFav.cat === c.id ? "#fff" : "#4a7068",
                    cursor: "pointer",
                  }}
                >{c.label}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {/* Modifier = retour Questions avec la question */}
              <button onClick={() => {
                if (onSetQuestion) onSetQuestion(editingFav.question);
                if (onNavigate) onNavigate("questions");
                setEditingFav(null);
              }}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "2px solid #3AA48A", background: "#fff", color: "#3AA48A", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={13} color="#3AA48A" />
                Modifier
              </button>
              {/* Supprimer */}
              <button onClick={() => {
                if (onDeleteFavori && editingFav.idx >= DEMO_FAVORIS.length) {
                  onDeleteFavori(editingFav.idx - DEMO_FAVORIS.length);
                }
                setEditingFav(null);
              }}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid #d94040", background: "#fff", color: "#d94040" }}
              >Supprimer</button>

              <div style={{ flex: 1 }} />
              {/* Annuler / Enregistrer */}
              <button onClick={() => setEditingFav(null)}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid #d0e8e2", background: "#fff", color: "#4a7068" }}
              >Annuler</button>
              <button onClick={() => {
                if (onEditFavori && editingFav.idx >= DEMO_FAVORIS.length) {
                  onEditFavori(editingFav.idx - DEMO_FAVORIS.length, editingFav.titre, editingFav.cat);
                }
                setEditingFav(null);
              }}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none", background: "#3AA48A", color: "#fff" }}
              >Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,48,48,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,.15)", textAlign: "center" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Ico d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={22} color="#d94040" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a3030", marginBottom: 8 }}>Supprimer ce dashboard ?</h3>
            <p style={{ fontSize: 13, color: "#4a7068", marginBottom: 20 }}>
              Le dashboard "<strong>{dashboards.find(d => d.id === confirmDelete)?.nom}</strong>" sera supprimé définitivement.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: "8px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid #d0e8e2", background: "#fff", color: "#4a7068" }}
              >Annuler</button>
              <button onClick={() => deleteDashboard(confirmDelete)}
                style={{ padding: "8px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none", background: "#d94040", color: "#fff" }}
              >Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouveau dashboard */}
      {showNewModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,48,48,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowNewModal(false)}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1a3030" }}>
              <Ico d="M12 5v14M5 12h14" size={18} color="#3AA48A" /> Nouveau dashboard
            </h2>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1a3030" }}>Nom du dashboard</label>
            <input
              type="text"
              value={newDbName}
              onChange={e => setNewDbName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createDashboard()}
              placeholder="Ex: Suivi hebdomadaire"
              autoFocus
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #3AA48A", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 16, color: "#1a3030" }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowNewModal(false)}
                style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none", background: "#f0f7f5", color: "#4a7068" }}
              >Annuler</button>
              <button onClick={createDashboard}
                style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none", background: "#3AA48A", color: "#fff" }}
              >Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
