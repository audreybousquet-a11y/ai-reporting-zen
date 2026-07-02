/**
 * Questions.tsx — Page de questions en langage naturel
 */
import { useState } from "react";
import { ask, AskResult } from "../lib/api";
import logoVert from "../../assets/Logo_vert.png";

interface QuestionsProps {
  id_magasin: string;
  user_id: string;
  onSaveFavori?: (result: AskResult) => void;
}

function ResultCard({ result, onSaveFavori }: { result: AskResult & { ts: string }; onSaveFavori?: (r: AskResult) => void }) {
  const [saved, setSaved] = useState(false);

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
              onClick={() => { setSaved(!saved); if (!saved && onSaveFavori) onSaveFavori(result); }}
            >⭐</button>
            <button className="rcard-btn">📥</button>
            <button className="rcard-btn">📌</button>
          </div>
        </div>
      </div>
      <div className="rcard-body">
        {result.data && result.data.length > 0 ? (
          <table className="dtable">
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
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Aucun résultat</p>
        )}
      </div>
      {result.commentaire && (
        <div className="rcard-comment">
          <div className="av">A</div>
          <div className="txt" dangerouslySetInnerHTML={{ __html: result.commentaire }} />
        </div>
      )}
      <div className="thumbs">
        <button>👍</button>
        <button>👎</button>
      </div>
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <img src={logoVert} alt="ar.ia" style={{ height: 32 }} />
        <div style={{ fontSize: 14, color: "#4a7068" }}>Posez votre question, ar.ia interroge toutes vos sources</div>
      </div>

      {/* Barre de question */}
      <div className="qbar">
        <span style={{ fontSize: 18, color: "var(--accent)" }}>💬</span>
        <input
          type="text"
          placeholder="Posez votre question en français..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAsk()}
          disabled={loading}
        />
        <button className="send" onClick={handleAsk} disabled={loading}>
          {loading ? "⏳" : "➤"}
        </button>
      </div>

      {/* Astuces (quand pas de résultats) */}
      {results.length === 0 && !error && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            🔍 <strong>Astuce</strong> — Vous pouvez demander la fiche d'une personne : <strong>"fiche de Damien Delaveau"</strong>. ar.ia affiche toutes les infos disponibles.
          </div>
          <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            📅 <strong>Conseil</strong> — Préférez les périodes relatives : <strong>ce mois, cette année, N-1</strong>… pour que vos favoris restent à jour.
          </div>
        </div>
      )}

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
