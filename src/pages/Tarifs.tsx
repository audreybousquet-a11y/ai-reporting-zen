import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Minus, Calculator, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ── Donnees ────────────────────────────────────────────────────────────── */

const FORMULES = [
  { id: "min", nom: "MIN", couleur: "border-border",       badge: "bg-muted text-muted-foreground" },
  { id: "mid", nom: "MID", couleur: "border-primary/40",   badge: "bg-primary/10 text-primary" },
  { id: "max", nom: "MAX", couleur: "border-primary",      badge: "hero-gradient text-white" },
];

const FEATURES: { nom: string; min: boolean | string; mid: boolean | string; max: boolean | string }[] = [
  { nom: "Quotas IA",          min: "15 / mois",  mid: "50 / mois",  max: "100 / mois" },
  { nom: "Favoris",            min: true,          mid: true,         max: true },
  { nom: "Dashboards",         min: false,         mid: true,         max: true },
  { nom: "Fusion de sources",  min: false,         mid: true,         max: true },
  { nom: "Emails automatises", min: false,         mid: false,        max: true },
];

const GRILLE: Record<string, { label: string; min: number; mid: number; max: number }> = {
  "1":   { label: "1 utilisateur",    min: 29, mid: 34, max: 39 },
  "2-4": { label: "2 a 4",            min: 25, mid: 29, max: 34 },
  "5+":  { label: "5 et plus",        min: 23, mid: 24, max: 29 },
};

function prixUnitaire(nb: number, formule: "min" | "mid" | "max") {
  if (nb >= 5) return GRILLE["5+"][formule];
  if (nb >= 2) return GRILLE["2-4"][formule];
  return GRILLE["1"][formule];
}

const SOURCES = [
  { nom: "Excel",    prix: null,  desc: "Inclus dans toutes les formules" },
  { nom: "Tine",     prix: 5,     desc: "Connecteur ERP Tine" },
  { nom: "Extrabat", prix: 10,    desc: "Connecteur ERP Extrabat" },
];

/* ── Composants ─────────────────────────────────────────────────────────── */

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string")
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  return value
    ? <Check className="h-5 w-5 text-primary mx-auto" />
    : <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const Tarifs = () => {
  const [nbUsers, setNbUsers] = useState(1);
  const [formule, setFormule] = useState<"min" | "mid" | "max">("mid");

  const pu = prixUnitaire(nbUsers, formule);
  const totalMois = pu * nbUsers;
  const totalAn   = totalMois * 12;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Tarifs
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Des prix simples, par utilisateur et par mois.<br className="hidden md:block" />
            Des remises automatiques des 2 utilisateurs.
          </p>
        </div>
      </section>

      {/* ── Tableau comparatif ────────────────────────────────────────── */}
      <section className="pb-16 md:pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Comparez les formules</h2>

          {/* Cartes desktop */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {FORMULES.map((f) => (
              <div key={f.id} className={`rounded-2xl border-2 ${f.couleur} bg-card p-6 flex flex-col`}>
                <div className="text-center mb-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${f.badge}`}>
                    {f.nom}
                  </span>
                </div>
                <div className="space-y-4 flex-1">
                  {FEATURES.map((feat) => (
                    <div key={feat.nom} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{feat.nom}</span>
                      <FeatureCell value={feat[f.id as "min" | "mid" | "max"]} />
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <div className="text-3xl font-extrabold text-foreground">
                    {GRILLE["1"][f.id as "min" | "mid" | "max"]} <span className="text-base font-normal text-muted-foreground">EUR/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">par utilisateur, a partir de</p>
                </div>
                <Button className="mt-6 w-full" variant={f.id === "max" ? "default" : "outline"} asChild>
                  <a href="#contact">Demander un devis</a>
                </Button>
              </div>
            ))}
          </div>

          {/* Tableau mobile */}
          <div className="md:hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium"></th>
                  {FORMULES.map((f) => (
                    <th key={f.id} className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase ${f.badge}`}>{f.nom}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feat) => (
                  <tr key={feat.nom} className="border-b border-border/50">
                    <td className="py-3 px-2 text-muted-foreground">{feat.nom}</td>
                    {FORMULES.map((f) => (
                      <td key={f.id} className="py-3 px-2 text-center">
                        <FeatureCell value={feat[f.id as "min" | "mid" | "max"]} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-3 px-2 font-medium text-foreground">Prix / mois</td>
                  {FORMULES.map((f) => (
                    <td key={f.id} className="py-3 px-2 text-center font-bold text-foreground">
                      {GRILLE["1"][f.id as "min" | "mid" | "max"]} EUR
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Grille tarifaire ──────────────────────────────────────────── */}
      <section className="section-alt py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Tarifs degressifs</h2>
          <p className="text-muted-foreground text-center mb-8">Plus vous etes nombreux, moins c'est cher.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-card rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="hero-gradient text-white">
                  <th className="py-3 px-4 text-left font-semibold">Nb utilisateurs</th>
                  <th className="py-3 px-4 text-center font-semibold">MIN</th>
                  <th className="py-3 px-4 text-center font-semibold">MID</th>
                  <th className="py-3 px-4 text-center font-semibold">MAX</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(GRILLE).map(([key, row]) => (
                  <tr key={key} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-4 text-muted-foreground font-medium">{row.label}</td>
                    <td className="py-3 px-4 text-center font-semibold">{row.min} EUR</td>
                    <td className="py-3 px-4 text-center font-semibold">{row.mid} EUR</td>
                    <td className="py-3 px-4 text-center font-semibold">{row.max} EUR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Calculateur ───────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl hero-gradient flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Estimez votre budget</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre d'utilisateurs</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={nbUsers}
                  onChange={(e) => setNbUsers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Formule</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["min", "mid", "max"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormule(f)}
                      className={`py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${
                        formule === f
                          ? "hero-gradient text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-muted-foreground">Prix unitaire</span>
                  <span className="text-lg font-bold text-foreground">{pu} EUR <span className="text-sm font-normal text-muted-foreground">/ mois</span></span>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-muted-foreground">Total mensuel</span>
                  <span className="text-2xl font-extrabold text-primary">{totalMois} EUR <span className="text-sm font-normal text-muted-foreground">/ mois</span></span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total annuel</span>
                  <span className="text-lg font-bold text-foreground">{totalAn} EUR <span className="text-sm font-normal text-muted-foreground">/ an</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sources de donnees ────────────────────────────────────────── */}
      <section className="section-alt py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Sources de donnees</h2>
          <p className="text-muted-foreground text-center mb-8">Connectez vos outils metier. A ajouter a votre formule.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {SOURCES.map((s) => (
              <div key={s.nom} className="bg-card border rounded-xl p-5 flex flex-col items-center text-center">
                <h3 className="font-semibold text-foreground text-lg mb-1">{s.nom}</h3>
                <p className="text-muted-foreground text-sm mb-3">{s.desc}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                  s.prix ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {s.prix ? `+ ${s.prix} EUR / mois` : "Inclus"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" id="contact">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Pret a demarrer ?</h2>
          <p className="text-muted-foreground mb-8">
            Contactez-nous pour une demo personnalisee ou un devis adapte a votre equipe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="mailto:audreybousquet@abcarre.fr" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Demander un devis
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://www.ar-ia.fr/#contact">Nous contacter</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tarifs;
