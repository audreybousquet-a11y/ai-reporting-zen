/**
 * Sidebar.tsx — Navigation principale ar.ia
 */
import { User } from "../lib/api";
import logoBlanc from "../../assets/Logo_blanc.png";

const SvgIcon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

interface SidebarProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, currentPage, onNavigate, onLogout }: SidebarProps) {
  const initials = `${(user.prenom || "")[0] || ""}${(user.nom || "")[0] || ""}`.toUpperCase();

  const navItems = [
    { id: "questions", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", label: "Questions" },
    { id: "dashboards", icon: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18", label: "Dashboards" },
    { id: "emails", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6", label: "Emails" },
    { id: "alertes", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0", label: "Alertes" },
  ];

  return (
    <nav className="sidebar">
      <div className="sb-logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={logoBlanc} alt="ar.ia" style={{ height: 28 }} />
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>ar<span style={{ color: "rgba(255,255,255,0.7)" }}>.ia</span></span>
      </div>
      <div className="sb-user">
        <div className="sb-avatar">{initials}</div>
        <div>
          <div className="sb-uname">{user.prenom} {user.nom}</div>
          <div className="sb-urole">{user.role === "admin_mag" ? "Administrateur" : user.role === "super_admin" ? "Super Admin" : "Utilisateur"}</div>
        </div>
      </div>
      <div className="sb-nav">
        <div className="sb-label">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`sb-item${currentPage === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="ic"><SvgIcon d={item.icon} size={16} /></span> {item.label}
          </div>
        ))}
      </div>
      <div className="sb-footer">
        <div
          className={`sb-item${currentPage === "params" ? " active" : ""}`}
          onClick={() => onNavigate("params")}
        >
          <span className="ic"><SvgIcon d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" size={16} /></span> Paramètres
        </div>
        <div
          className={`sb-item${currentPage === "aide" ? " active" : ""}`}
          onClick={() => onNavigate("aide")}
        >
          <span className="ic"><SvgIcon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" size={16} /></span> Aide
        </div>
        <div className="sb-item" onClick={onLogout}>
          <span className="ic"><SvgIcon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={16} /></span> Déconnexion
        </div>
      </div>
    </nav>
  );
}
