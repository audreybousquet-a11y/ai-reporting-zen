/**
 * Login.tsx — Page de connexion
 */
import { useState } from "react";
import logoVert from "../../assets/Logo_vert.png";

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<string | null>;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await onLogin(username, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 380, boxShadow: "0 8px 40px rgba(58,164,138,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <img src={logoVert} alt="ar.ia" style={{ height: 44 }} />
            <span style={{ fontSize: 32, fontWeight: 800, color: "#1a3030" }}>ar<span style={{ color: "#3AA48A" }}>.ia</span></span>
          </div>
          <p style={{ color: "#4a7068", fontSize: 14 }}>Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#1a3030" }}>Identifiant</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #3AA48A", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", marginBottom: 16, color: "#1a3030" }}
            placeholder="Votre identifiant"
          />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#1a3030" }}>Mot de passe</label>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", paddingRight: 42, borderRadius: 10, border: "1.5px solid #3AA48A", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", color: "#1a3030" }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#8ab8b0", padding: 4 }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ab8b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ab8b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {error && <p style={{ color: "#d94040", fontSize: 13, marginBottom: 16 }}>❌ {error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: "100%", padding: 12, borderRadius: 10,
              background: "#3AA48A", color: "#fff", border: "none",
              fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
