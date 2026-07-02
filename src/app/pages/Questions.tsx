/**
 * Questions.tsx — Page de questions en langage naturel
 */
import { useState } from "react";
import { ask, AskResult } from "../lib/api";
import Chart from "../components/Chart";
import logoVert from "../../assets/Logo_vert.png";

interface QuestionsProps {
  id_magasin: string;
  user_id: string;
  onSaveFavori?: (titre: string, cat: string, result: AskResult) => void;
}

const CATEGORIES = [
  { id: "equipe", label: "Équipe & RH" },
  { id: "chantier", label: "Chantiers" },
  { id: "absence", label: "Absences" },
  { id: "finance", label: "Finances" },
  { id: "general", label: "Général" },
];

function SaveFavoriModal({ question, onSave, onClose }: { question: string; onSave: (nom: string, cat: string) => void; onClose: () => void }) {
  const [nom, setNom] = useState(question);
  const [cat, setCat] = useState("equipe");

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,48,48,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a3030", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Sauvegarder en favori
        </h3>

        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#1a3030" }}>Nom du favori</label>
        <input
          type="text"
          value={nom}
          onChange={e => setNom(e.target.value)}
          autoFocus
          style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #3AA48A", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 16, color: "#1a3030" }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8, color: "#1a3030" }}>Catégorie</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                border: `2px solid ${cat === c.id ? "#3AA48A" : "#d0e8e2"}`,
                background: cat === c.id ? "#3AA48A" : "#fff",
                color: cat === c.id ? "#fff" : "#4a7068",
                cursor: "pointer", transition: "all .15s",
              }}
            >{c.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid #d0e8e2", background: "#fff", color: "#4a7068" }}
          >Annuler</button>
          <button onClick={() => { if (nom.trim()) onSave(nom.trim(), cat); }}
            style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "none", background: "#3AA48A", color: "#fff" }}
          >Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, onSaveFavori }: { result: AskResult & { ts: string }; onSaveFavori?: (titre: string, cat: string, r: AskResult) => void }) {
  const [saved, setSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  return (
    <div className="rcard">
      <div className="rcard-head">
        <div className="rcard-q">
          {saved && <span style={{ color: "var(--accent)" }}>⭐</span>}
          {result.question}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="rcard-time">{result.ts}</span>
          <span style={{ fontSize: 11, color: "var(--dim)" }}>{result.source}</span>
          <div className="rcard-actions">
            <button
              className={`rcard-btn${saved ? " fav" : ""}`}
              onClick={() => { if (!saved) setShowSaveModal(true); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? "#c47a20" : "none"} stroke={saved ? "#c47a20" : "currentColor"} strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 3 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {saved ? "Sauvegardé" : "Favori"}
            </button>
            <button className="rcard-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 3 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Exporter
            </button>
            <button className="rcard-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 3 }}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
              Dashboard
            </button>
            <button className="rcard-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 3 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Modifier
            </button>
          </div>
        </div>
      </div>
      <div className="rcard-body">
        {result.data && result.data.length > 0 ? (
          (() => {
            let vt = result.viz_config?.type_viz || "table";
            const row0 = result.data[0] || {};
            // Détecter dimension (texte/catégorie) vs mesure (nombre pur)
            // "mois" avec valeurs 1,2,3 = dimension, pas mesure
            const isDimension = (c: string, v: any) => {
              if (typeof v === "string") return true;
              const name = c.toLowerCase();
              if (["mois", "semaine", "annee", "année", "periode", "jour", "trimestre"].includes(name)) return true;
              if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 53) return name.includes("mois") || name.includes("sem") || name.includes("ann");
              return false;
            };
            const dimCols = result.columns.filter(c => isDimension(c, row0[c]));
            const numCols = result.columns.filter(c => !isDimension(c, row0[c]) && (typeof row0[c] === "number" || !isNaN(Number(row0[c]))));
            const n = result.data.length;

            // Pivot → camembert si peu de lignes, sinon barres
            if (vt === "pivot" && n <= 10) vt = n <= 8 ? "pie" : "bar";
            // Table avec 1 dimension + mesures → graphique auto
            if (vt === "table" && dimCols.length === 1 && numCols.length >= 1 && n <= 20) {
              const dimName = dimCols[0].toLowerCase();
              // Mois, semaine = évolution → ligne
              if (["mois", "semaine", "trimestre"].includes(dimName) || dimName.includes("mois") || dimName.includes("date")) {
                vt = "line";
              // Peu de catégories → camembert
              } else if (n <= 8 && numCols.length === 1) {
                vt = "pie";
              // Sinon → barres
              } else {
                vt = "bar";
              }
            }
            const isChart = ["bar", "hbar", "line", "pie", "area"].includes(vt);
            return (
              <>
                {isChart && <Chart data={result.data} columns={result.columns} vizType={vt} height={280} />}
                {(!isChart || result.data.length <= 20) && (
                  <table className="dtable" style={isChart ? { marginTop: 16 } : {}}>
                    <thead>
                      <tr>{result.columns.map(c => <th key={c} className={typeof result.data[0]?.[c] === "number" ? "n" : ""}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.data.map((row, i) => (
                        <tr key={i}>
                          {result.columns.map(c => (
                            <td key={c} className={typeof row[c] === "number" ? "n" : ""}>
                              {typeof row[c] === "number" ? row[c].toLocaleString("fr-FR") : row[c]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            );
          })()
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucun résultat</p>
        )}
      </div>
      {result.commentaire && (
        <div className="rcard-comment">
          <div className="av">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8M2 14h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H2zM22 14h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2zM6 14v-4a6 6 0 1 1 12 0v4"/></svg>
          </div>
          <div className="txt" dangerouslySetInnerHTML={{ __html: result.commentaire }} />
        </div>
      )}
      <div className="thumbs">
        <button title="Utile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        </button>
        <button title="Pas utile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15V19a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
        </button>
      </div>
      {/* Modal sauvegarde favori */}
      {showSaveModal && (
        <SaveFavoriModal
          question={result.question}
          onClose={() => setShowSaveModal(false)}
          onSave={(nom, cat) => {
            setSaved(true);
            setShowSaveModal(false);
            if (onSaveFavori) onSaveFavori(nom, cat, result);
          }}
        />
      )}
    </div>
  );
}

export default function Questions({ id_magasin, user_id, onSaveFavori }: QuestionsProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(AskResult & { ts: string })[]>([]);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await ask(question, id_magasin, user_id);
      const ts = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      if (result.success) {
        setResults([{ ...result, ts }, ...results]);
        setQuestion("");
      } else {
        setError(result.error || "Erreur");
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Header comme avant */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <img src={logoVert} alt="ar.ia" style={{ height: 36 }} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a3030" }}>ar<span style={{ color: "#3AA48A" }}>.ia</span></div>
          <div style={{ fontSize: 13, color: "#4a7068" }}>Votre assistant reporting</div>
        </div>
      </div>

      {/* Astuces */}
      {results.length === 0 && !error && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, padding: "14px 18px", fontSize: 12, color: "#4a7068", lineHeight: 1.6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <strong style={{ color: "#3AA48A" }}>Astuce du jour</strong> — Vous pouvez demander la fiche d'une personne : <strong>"fiche de Damien Delaveau"</strong>. ar.ia affiche toutes les infos disponibles.
          </div>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, padding: "14px 18px", fontSize: 12, color: "#4a7068", lineHeight: 1.6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <strong style={{ color: "#3AA48A" }}>Conseil</strong> — Préférez les périodes relatives : <strong>ce mois, cette année, N-1</strong>… Évitez les dates fixes pour que vos favoris restent à jour.
          </div>
        </div>
      )}

      {/* Barre de question — sans flèche */}
      <div className="qbar" style={{ border: "2px solid #3AA48A" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <input
          type="text"
          placeholder="Posez votre question en français..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAsk()}
          disabled={loading}
        />
      </div>

      {/* Boutons sous la zone question — pleine largeur comme Streamlit */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 8, marginBottom: 20 }}>
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{ padding: "11px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", border: "none", background: (!question.trim() || loading) ? "#d0e8e2" : "#3AA48A", color: (!question.trim() || loading) ? "#8ab8b0" : "#fff", cursor: (!question.trim() || loading) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s" }}
        >
          {loading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          )}
          {loading ? "Analyse en cours..." : "Analyser"}
        </button>
        <button
          onClick={() => { setQuestion(""); setResults([]); setError(""); }}
          style={{ padding: "11px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "inherit", border: "2px solid #d0e8e2", background: "#fff", color: "#4a7068", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Effacer
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: "var(--red-bg)", border: "1px solid #f5c6cb", borderRadius: "var(--radius)", padding: 14, marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
          ❌ {error}
        </div>
      )}

      {/* Résultats */}
      {results.map((r, i) => (
        <ResultCard key={i} result={r} onSaveFavori={onSaveFavori} />
      ))}
    </div>
  );
}
