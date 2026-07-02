/**
 * AriaApp.tsx — Composant principal de l'application ar.ia
 */
import { useState, useCallback } from "react";

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div onClick={() => setOn(!on)}
      style={{ width: 40, height: 22, borderRadius: 11, background: on ? "#3AA48A" : "#d0e8e2", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "left .2s" }} />
    </div>
  );
}
import { useAuth } from "./hooks/useAuth";
import { AskResult } from "./lib/api";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Questions from "./pages/Questions";
import Params from "./pages/Params";
import Dashboards from "./pages/Dashboards";
import "./app.css";

export interface SavedFavori {
  titre: string;
  question: string;
  cat: string;
  viz: string;
  sql: string;
  viz_config: Record<string, any>;
}

export default function AriaApp() {
  const { user, loading, login, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("questions");
  const [savedFavoris, setSavedFavoris] = useState<SavedFavori[]>([]);

  const handleSaveFavori = useCallback((titre: string, cat: string, result: AskResult) => {
    // Déterminer le type de viz
    let viz = "tableau";
    const vt = result.viz_config?.type_viz || "table";
    if (["bar", "hbar"].includes(vt)) viz = "barres";
    else if (["line", "area"].includes(vt)) viz = "ligne";
    else if (vt === "pie") viz = "camembert";
    else if (vt === "kpi") viz = "kpi";
    // Auto-detect si table
    if (viz === "tableau" && result.data?.length > 0) {
      const row0 = result.data[0];
      const textCols = result.columns.filter(c => typeof row0[c] === "string");
      const numCols = result.columns.filter(c => typeof row0[c] === "number");
      if (textCols.length === 1 && numCols.length >= 1 && result.data.length <= 15) viz = "barres";
      if (result.data.length === 1 && result.columns.length <= 2) viz = "kpi";
    }

    const newFav: SavedFavori = {
      titre,
      question: result.question,
      cat,
      viz,
      sql: result.sql,
      viz_config: result.viz_config,
    };
    setSavedFavoris(prev => [...prev, newFav]);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 800 }}>ar<span style={{ color: "var(--accent)" }}>.ia</span></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={logout}
      />
      <div className="app-main">
        <div className="topbar">
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
          </div>
        </div>
        <div className="app-content">
          <div style={{ display: currentPage === "questions" ? "block" : "none" }}>
            <Questions id_magasin={user.id_magasin} user_id={user.id} onSaveFavori={handleSaveFavori} />
          </div>
          <div style={{ display: currentPage === "dashboards" ? "block" : "none" }}>
            <Dashboards id_magasin={user.id_magasin} user_id={user.id} savedFavoris={savedFavoris} />
          </div>
          {currentPage === "emails" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/></svg>
                    Emails programmés
                  </h2>
                  <p style={{ color: "#4a7068", fontSize: 13 }}>Envoyez automatiquement vos favoris par email à vos collaborateurs</p>
                </div>
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#3AA48A", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Nouvel email
                </button>
              </div>
              <div style={{ background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, padding: "20px 24px" }}>
                {[
                  { titre: "Rapport hebdomadaire équipe", desc: "Chaque lundi à 8h — 3 favoris", dest: "mikael@artetlamatiere.fr", on: true },
                  { titre: "Suivi chantiers mensuel", desc: "Le 1er de chaque mois — 2 favoris", dest: "direction@artetlamatiere.fr", on: false },
                ].map((email, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 1 ? "1px solid #e8f4f1" : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: email.on ? "#e8f4f1" : "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={email.on ? "#3AA48A" : "#c47a20"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a3030" }}>{email.titre}</div>
                      <div style={{ fontSize: 12, color: "#4a7068" }}>{email.desc} — {email.dest}</div>
                    </div>
                    <Toggle initial={email.on} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentPage === "alertes" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    Alertes
                  </h2>
                  <p style={{ color: "#4a7068", fontSize: 13 }}>Soyez notifié quand vos indicateurs dépassent un seuil</p>
                </div>
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#3AA48A", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Nouvelle alerte
                </button>
              </div>
              <div style={{ background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, padding: "20px 24px" }}>
                {[
                  { titre: "Chantier en dépassement > 20%", desc: "Vérifie chaque jour — Notification email + app", color: "#d94040", bg: "#fce4ec", on: true },
                  { titre: "Facture impayée > 30 jours", desc: "Vérifie chaque semaine — Notification email", color: "#c47a20", bg: "#fff3e0", on: true },
                  { titre: "Heures sup > 10h / salarié", desc: "Vérifie chaque semaine — Notification app", color: "#c47a20", bg: "#fff3e0", on: false },
                ].map((alerte, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? "1px solid #e8f4f1" : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: alerte.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={alerte.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a3030" }}>{alerte.titre}</div>
                      <div style={{ fontSize: 12, color: "#4a7068" }}>{alerte.desc}</div>
                    </div>
                    <Toggle initial={alerte.on} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentPage === "params" && (
            <Params user={user} />
          )}
          {currentPage === "aide" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
                Aide
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Documentation et tutoriels</p>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--dim)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 12 }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>Bientôt disponible</p>
                <p style={{ fontSize: 13 }}>Vidéos, lexique métier et guides d'utilisation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
