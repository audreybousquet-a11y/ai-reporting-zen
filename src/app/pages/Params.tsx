/**
 * Params.tsx — Page Paramètres complète
 */
import { useState } from "react";
import { User, getStripePortalUrl } from "../lib/api";

interface ParamsProps {
  user: User;
}

type Tab = "sources" | "profils" | "abonnement" | "apparence";

// Icônes SVG (style Lucide) — plus pro que les emojis
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const icons = {
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  card: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM1 10h22",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  palette: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.48-9-10-9z",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  bot: "M12 8V4H8M2 14h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H2zM22 14h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2zM6 14v-4a6 6 0 1 1 12 0v4",
  table: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  thumbsUp: "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3",
  lightbulb: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  sync: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  unlink: "M18.84 12.25l1.72-1.71a4 4 0 0 0-5.66-5.66l-1.71 1.72M5.17 11.75l-1.72 1.71a4 4 0 0 0 5.66 5.66l1.71-1.72",
};

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "sources", icon: "folder", label: "Sources" },
  { id: "profils", icon: "users", label: "Profils" },
  { id: "abonnement", icon: "card", label: "Abonnement" },
  { id: "apparence", icon: "palette", label: "Apparence" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: "pointer",
        background: on ? "#3AA48A" : "#d0e8e2", position: "relative", transition: "background .2s",
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: on ? 21 : 3, transition: "left .2s",
      }} />
    </div>
  );
}

function ParamRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e8f4f1" }}>
      <span style={{ fontSize: 13, color: "#1a3030" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{children}</div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #d0e8e2", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Badge({ text, color = "#3AA48A", bg = "#e8f4f1" }: { text: string; color?: string; bg?: string }) {
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>{text}</span>;
}

function Btn({ children, primary, danger, onClick }: { children: React.ReactNode; primary?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: "1px solid",
        background: primary ? "#3AA48A" : "#fff",
        color: primary ? "#fff" : danger ? "#d94040" : "#3AA48A",
        borderColor: primary ? "#3AA48A" : danger ? "#d94040" : "#3AA48A",
      }}
    >{children}</button>
  );
}

function SourceCard({ icon, name, desc, status, lastSync, connected }: { icon: string; name: string; desc: string; status: string; lastSync?: string; connected: boolean }) {
  return (
    <div style={{ border: `1.5px solid ${connected ? "#3AA48A" : "#d0e8e2"}`, borderRadius: 12, padding: 16, position: "relative" }}>
      {connected && <div style={{ position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: "50%", background: "#3AA48A" }} />}
      {!connected && <div style={{ position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: "50%", background: "#c47a20" }} />}
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
      <div style={{ fontSize: 12, color: "#4a7068", margin: "4px 0 10px" }}>{desc}</div>
      {connected ? (
        <>
          <div style={{ fontSize: 11, color: "#3AA48A", fontWeight: 600 }}>✓ Connecté{lastSync ? ` — ${lastSync}` : ""}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <Btn>Synchroniser</Btn>
            <Btn danger>Déconnecter</Btn>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 10 }}><Btn primary>Configurer</Btn></div>
      )}
    </div>
  );
}

function UserCard({ initials, name, email, role, formule, color, isSelf }: { initials: string; name: string; email: string; role: string; formule: string; color: string; isSelf?: boolean }) {
  return (
    <div style={{ border: "1px solid #d0e8e2", borderRadius: 12, padding: 16, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, margin: "0 auto 8px" }}>{initials}</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
      <div style={{ fontSize: 11, color: "#4a7068", margin: "2px 0 8px" }}>{email}</div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        <Badge text={role.toUpperCase()} color={isSelf ? "#3AA48A" : "#4a7068"} bg={isSelf ? "#e8f4f1" : "#f0f7f5"} />
        <Badge text={formule.toUpperCase()} />
      </div>
      {!isSelf && (
        <div style={{ marginTop: 8, display: "flex", gap: 4, justifyContent: "center" }}>
          <Btn>Modifier</Btn>
          <Btn danger>Retirer</Btn>
        </div>
      )}
    </div>
  );
}

export default function Params({ user }: ParamsProps) {
  const [tab, setTab] = useState<Tab>("sources");
  const [theme, setTheme] = useState("light");
  const [aiComment, setAiComment] = useState(true);
  const [showTotals, setShowTotals] = useState(true);
  const [showThumbs, setShowThumbs] = useState(true);
  const [showTips, setShowTips] = useState(true);

  const initials = `${(user.prenom || "")[0] || ""}${(user.nom || "")[0] || ""}`.toUpperCase();

  const handleStripePortal = async () => {
    if (user.stripe_customer_id) {
      const url = await getStripePortalUrl(user.stripe_customer_id);
      if (url) window.open(url, "_blank");
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: "#1a3030" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3AA48A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        <span style={{ color: "#3AA48A" }}>Paramètres</span>
      </h2>
      <p style={{ fontSize: 13, color: "#4a7068", marginBottom: 20 }}>Configuration de votre espace ar.ia</p>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "2px solid #e8f4f1", paddingBottom: 2 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "transparent", border: "none", borderBottom: `3px solid ${tab === t.id ? "#3AA48A" : "transparent"}`,
              padding: "10px 18px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", marginBottom: -2,
              color: tab === t.id ? "#3AA48A" : "#4a7068", cursor: "pointer", transition: "all .15s",
            }}
          >
            <Icon d={icons[t.icon as keyof typeof icons]} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Sources */}

      {/* Abonnement */}
      {tab === "abonnement" && (
        <Section>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "#e8f4f1", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3AA48A" }}>175 €</div>
              <div style={{ fontSize: 11, color: "#4a7068" }}>HT / mois</div>
            </div>
            <div style={{ flex: 1, background: "#f0f7f5", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>5</div>
              <div style={{ fontSize: 11, color: "#4a7068" }}>utilisateurs</div>
            </div>
            <div style={{ flex: 1, background: "#f0f7f5", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{user.connecteurs?.length || 0}</div>
              <div style={{ fontSize: 11, color: "#4a7068" }}>connecteurs</div>
            </div>
          </div>
          <ParamRow label="Formule"><span style={{ fontSize: 13, color: "#4a7068" }}>{user.licences ? Object.entries(user.licences).filter(([,v]) => v > 0).map(([k,v]) => `${v} × ${k.toUpperCase()}`).join(" + ") : user.formule?.toUpperCase()}</span></ParamRow>
          <ParamRow label="Connecteurs"><span style={{ fontSize: 13, color: "#4a7068" }}>{user.connecteurs?.join(", ") || "Aucun"}</span></ParamRow>
          <ParamRow label="Prochain prélèvement"><span style={{ fontSize: 13, color: "#4a7068" }}>1er août 2026</span></ParamRow>
          <ParamRow label="Moyen de paiement">
            <span style={{ fontSize: 13, color: "#4a7068" }}>•••• 4242</span>
            <Btn>Modifier</Btn>
          </ParamRow>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn primary onClick={handleStripePortal}>Voir mes factures</Btn>
            <Btn onClick={handleStripePortal}>Gérer mon abonnement</Btn>
            <Btn danger>Résilier</Btn>
          </div>
        </Section>
      )}

      {/* Sources */}
      {tab === "sources" && (
        <Section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <SourceCard icon="⏱" name="Deytime" desc="Gestion du temps & absences" status="connected" lastSync="Syncé le 02/07 à 03:15" connected={true} />
            <SourceCard icon="📄" name="Extrabat" desc="Devis & factures BTP" status="connected" lastSync="Syncé le 02/07 à 03:20" connected={true} />
            <SourceCard icon="💰" name="Pennylane" desc="Comptabilité" status="disconnected" connected={false} />
            <div
              style={{
                border: "2px dashed #d0e8e2", borderRadius: 12, padding: 16,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, cursor: "pointer", color: "#8ab8b0", transition: "all .2s",
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3AA48A"; (e.currentTarget as HTMLElement).style.color = "#3AA48A"; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d0e8e2"; (e.currentTarget as HTMLElement).style.color = "#8ab8b0"; }}
            >
              <div style={{ fontSize: 28 }}>+</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Ajouter une source</div>
              <div style={{ fontSize: 11 }}>Excel, Google Sheets, API...</div>
            </div>
          </div>
        </Section>
      )}

      {/* Profils */}
      {tab === "profils" && (
        <Section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a3030" }}>Profils</span>
              <span style={{ fontSize: 13, color: "#4a7068", marginLeft: 8 }}>3 utilisateurs sur 5 sièges</span>
            </div>
            <Btn primary>+ Inviter un utilisateur</Btn>
          </div>
          {/* Barre de progression */}
          <div style={{ background: "#e8f4f1", borderRadius: 6, height: 8, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ background: "#3AA48A", height: "100%", width: "60%", borderRadius: 6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <UserCard initials={initials} name={`${user.prenom} ${user.nom}`} email={user.email} role="admin" formule={user.formule || "mid"} color="#3AA48A" isSelf={false} />
            <UserCard initials="LD" name="Laurent Dupont" email="laurent@artetlamatiere.fr" role="user" formule="mid" color="#2a7ab0" />
            <UserCard initials="SM" name="Sophie Martin" email="sophie@artetlamatiere.fr" role="user" formule="min" color="#c47a20" />
          </div>
        </Section>
      )}

      {/* Apparence */}
      {tab === "apparence" && (
        <Section>
          <ParamRow label="Thème">
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1.5px solid #3AA48A",
                fontSize: 13, fontFamily: "inherit", color: "#1a3030", background: "#fff",
                cursor: "pointer", outline: "none", minWidth: 160,
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="deytime">Deytime</option>
            </select>
          </ParamRow>
          <ParamRow label="Commentaire IA automatique"><Toggle on={aiComment} onToggle={() => setAiComment(!aiComment)} /></ParamRow>
          <ParamRow label="Totaux sur les tableaux"><Toggle on={showTotals} onToggle={() => setShowTotals(!showTotals)} /></ParamRow>
          <ParamRow label="Boutons de feedback"><Toggle on={showThumbs} onToggle={() => setShowThumbs(!showThumbs)} /></ParamRow>
          <ParamRow label="Astuces sur la page Questions"><Toggle on={showTips} onToggle={() => setShowTips(!showTips)} /></ParamRow>
        </Section>
      )}
    </div>
  );
}
