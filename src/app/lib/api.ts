/**
 * api.ts — Client API ar.ia
 * Toutes les communications avec le backend FastAPI
 */

const API_URL = "https://dev.ar-ia.fr";

// ── Types ──

export interface User {
  id: string;
  username: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  id_magasin: string;
  role: string;
  formule: string;
  entreprise?: string;
  connecteurs?: string[];
  licences?: Record<string, number>;
  stripe_customer_id?: string;
}

export interface AskResult {
  success: boolean;
  question: string;
  sql: string;
  viz_config: Record<string, any>;
  data: Record<string, any>[];
  columns: string[];
  nb_rows: number;
  commentaire: string;
  source: string;
  sources_disponibles: string[];
  error?: string;
}

export interface Favori {
  titre: string;
  question: string;
  sql: string;
  viz_config: Record<string, any>;
  categorie?: string;
  dashboard_ids?: string[];
  source_label?: string;
}

export interface Dashboard {
  id: string;
  nom: string;
  favoris: Favori[];
}

// ── API Calls ──

export async function login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const resp = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return resp.json();
}

export async function ask(question: string, id_magasin: string, user_id: string = ""): Promise<AskResult> {
  const resp = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, id_magasin, user_id }),
  });
  return resp.json();
}

export async function getFavoris(source_label: string, user_id: string = ""): Promise<Favori[]> {
  const resp = await fetch(`${API_URL}/api/favoris/${encodeURIComponent(source_label)}?user_id=${user_id}`);
  const data = await resp.json();
  return data.favoris || [];
}

export async function saveFavoris(source_label: string, favoris: Favori[], user_id: string = ""): Promise<void> {
  await fetch(`${API_URL}/api/favoris/${encodeURIComponent(source_label)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favoris, user_id }),
  });
}

export async function getDashboards(source_label: string, user_id: string = ""): Promise<Dashboard[]> {
  const resp = await fetch(`${API_URL}/api/dashboards/${encodeURIComponent(source_label)}?user_id=${user_id}`);
  const data = await resp.json();
  return data.dashboards || [];
}

export async function saveDashboards(source_label: string, dashboards: Dashboard[], user_id: string = ""): Promise<void> {
  await fetch(`${API_URL}/api/dashboards/${encodeURIComponent(source_label)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dashboards, user_id }),
  });
}

export async function getSources(id_magasin: string): Promise<{ label: string; tables: number }[]> {
  const resp = await fetch(`${API_URL}/api/sources/${id_magasin}`);
  const data = await resp.json();
  return data.sources || [];
}

export async function getStripePortalUrl(customer_id: string): Promise<string | null> {
  const resp = await fetch(`${API_URL}/api/stripe-portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id }),
  });
  const data = await resp.json();
  return data.url || null;
}
