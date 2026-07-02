/**
 * AriaApp.tsx — Composant principal de l'application ar.ia
 */
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Questions from "./pages/Questions";
import Params from "./pages/Params";
import "./app.css";

export default function AriaApp() {
  const { user, loading, login, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState("questions");

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
          {currentPage === "questions" && (
            <Questions id_magasin={user.id_magasin} user_id={user.id} />
          )}
          {currentPage === "dashboards" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                Dashboards
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Vos tableaux de bord personnalisés</p>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--dim)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 12 }}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>Bientôt disponible</p>
                <p style={{ fontSize: 13 }}>Composez vos tableaux de bord en glissant vos favoris</p>
              </div>
            </div>
          )}
          {currentPage === "emails" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/></svg>
                Emails programmés
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Envoyez automatiquement vos favoris par email</p>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--dim)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 12 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/></svg>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>Bientôt disponible</p>
                <p style={{ fontSize: 13 }}>Planifiez l'envoi de vos rapports à vos collaborateurs</p>
              </div>
            </div>
          )}
          {currentPage === "alertes" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#3AA48A" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Alertes
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Soyez notifié quand vos indicateurs dépassent un seuil</p>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--dim)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 12 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>Bientôt disponible</p>
                <p style={{ fontSize: 13 }}>Configurez des alertes sur vos indicateurs clés</p>
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
