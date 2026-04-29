import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Minus, Calculator, Mail, Phone, Zap, Star, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ── Donnees ────────────────────────────────────────────────────────────── */

const FORMULES = [
  {
    id: "min" as const, nom: "MIN", desc: "Pour decouvrir ar.ia",
    recommended: false,
  },
  {
    id: "mid" as const, nom: "MID", desc: "Le plus populaire",
    recommended: true,
  },
  {
    id: "max" as const, nom: "MAX", desc: "Performance maximale",
    recommended: false,
  },
];

type FormulaId = "min" | "mid" | "max";

const FEATURES: { nom: string; categorie?: string; min: boolean | string; mid: boolean | string; max: boolean | string }[] = [
  { nom: "Questions IA / mois",  min: "15",   mid: "50",   max: "100" },
  { nom: "Favoris",              min: true,    mid: true,   max: true },
  { nom: "Dashboards",           min: false,   mid: true,   max: true },
  { nom: "Fusion de sources",    min: false,   mid: true,   max: true },
  { nom: "Emails automatises",   min: false,   mid: false,  max: true },
];

const PRIX: Record<string, Record<FormulaId, number>> = {
  "1":   { min: 29, mid: 34, max: 39 },
  "2-4": { min: 25, mid: 29, max: 34 },
  "5+":  { min: 23, mid: 24, max: 29 },
};

const TRANCHES = [
  { key: "1",   label: "1 utilisateur" },
  { key: "2-4", label: "2 a 4 utilisateurs" },
  { key: "5+",  label: "5 et plus" },
];

function prixUnitaire(nb: number, formule: FormulaId) {
  if (nb >= 5) return PRIX["5+"][formule];
  if (nb >= 2) return PRIX["2-4"][formule];
  return PRIX["1"][formule];
}

const SOURCES = [
  { nom: "Excel",    prix: null,  icon: "📊", desc: "Importez vos fichiers Excel" },
  { nom: "Tine",     prix: 5,     icon: "🔗", desc: "Connecteur ERP Tine" },
  { nom: "Extrabat", prix: 10,    icon: "🏗️", desc: "Connecteur ERP Extrabat" },
];

/* ── Composants ─────────────────────────────────────────────────────────── */

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string")
    return <span className="font-semibold text-foreground">{value}</span>;
  return value
    ? <Check className="h-5 w-5 text-primary" />
    : <Minus className="h-4 w-4 text-muted-foreground/30" />;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const Tarifs = () => {
  const [nbUsers, setNbUsers] = useState(3);
  const [formule, setFormule] = useState<FormulaId>("mid");
  const [annuel, setAnnuel] = useState(false);

  const pu = prixUnitaire(nbUsers, formule);
  const totalMois = pu * nbUsers;
  const totalAn   = totalMois * 12;
  const economieAn = annuel ? Math.round(totalMois * 12 * 0.1) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Tarification transparente
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Un prix simple,<br className="hidden md:block" /> adapte a votre equipe
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Par utilisateur, par mois. Des remises automatiques des 2 utilisateurs.
            Sans engagement, sans surprise.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annuel ? "text-foreground" : "text-muted-foreground"}`}>Mensuel</span>
            <button
              onClick={() => setAnnuel(!annuel)}
              className={`relative w-14 h-7 rounded-full transition-colors ${annuel ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${annuel ? "translate-x-7" : ""}`} />
            </button>
            <span className={`text-sm font-medium ${annuel ? "text-foreground" : "text-muted-foreground"}`}>Annuel</span>
            {annuel && (
              <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                -10%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Cartes formules ───────────────────────────────────────────── */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {FORMULES.map((f) => {
              const prix1 = PRIX["1"][f.id];
              const prixAffiche = annuel ? Math.round(prix1 * 0.9) : prix1;
              const isReco = f.recommended;

              return (
                <div
                  key={f.id}
                  className={`relative rounded-2xl bg-card p-6 md:p-7 flex flex-col transition-all ${
                    isReco
                      ? "border-2 border-primary shadow-lg shadow-primary/10 md:-mt-3 md:mb-0 md:pb-10"
                      : "border border-border shadow-sm hover:shadow-md"
                  }`}
                >
                  {isReco && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full hero-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md">
                        <Star className="h-3.5 w-3.5" /> Recommande
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-5 mt-1">
                    <h3 className="text-xl font-bold text-foreground">{f.nom}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>

                  {/* Prix */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold text-foreground">{prixAffiche}</span>
                      <span className="text-lg text-muted-foreground font-medium">EUR</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">par utilisateur / mois</p>
                    {annuel && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        soit {prixAffiche * 12} EUR / an par utilisateur
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {FEATURES.map((feat) => {
                      const val = feat[f.id];
                      const included = val === true || typeof val === "string";
                      return (
                        <div key={feat.nom} className="flex items-center gap-3">
                          {included
                            ? <Check className="h-4 w-4 text-primary shrink-0" />
                            : <Minus className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          }
                          <span className={`text-sm ${included ? "text-foreground" : "text-muted-foreground/50"}`}>
                            {feat.nom}
                            {typeof val === "string" && (
                              <span className="ml-1.5 font-semibold text-primary">{val}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <Button
                    className={`mt-6 w-full ${isReco ? "animate-shimmer" : ""}`}
                    variant={isReco ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <a href="mailto:audreybousquet@abcarre.fr?subject=Devis%20ar.ia%20-%20Formule%20{f.nom}">
                      {isReco ? "Demarrer maintenant" : "Demander un devis"}
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Grille degressive ─────────────────────────────────────────── */}
      <section className="section-alt py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Tarifs degressifs</h2>
          <p className="text-muted-foreground text-center mb-8">Plus vous etes nombreux, moins c'est cher.</p>

          <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="hero-gradient text-white">
                  <th className="py-3.5 px-5 text-left font-semibold">Utilisateurs</th>
                  <th className="py-3.5 px-5 text-center font-semibold">MIN</th>
                  <th className="py-3.5 px-5 text-center font-semibold">MID</th>
                  <th className="py-3.5 px-5 text-center font-semibold">MAX</th>
                </tr>
              </thead>
              <tbody>
                {TRANCHES.map((t, i) => (
                  <tr key={t.key} className={i < TRANCHES.length - 1 ? "border-b border-border/50" : ""}>
                    <td className="py-3.5 px-5 text-muted-foreground font-medium">{t.label}</td>
                    <td className="py-3.5 px-5 text-center font-semibold text-foreground">{PRIX[t.key].min} EUR</td>
                    <td className="py-3.5 px-5 text-center font-semibold text-primary">{PRIX[t.key].mid} EUR</td>
                    <td className="py-3.5 px-5 text-center font-semibold text-foreground">{PRIX[t.key].max} EUR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Calculateur ───────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl hero-gradient flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Estimez votre budget</h2>
                <p className="text-xs text-muted-foreground">Selectionnez votre formule et nombre d'utilisateurs</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Formule */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Formule</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["min", "mid", "max"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormule(f)}
                      className={`py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all ${
                        formule === f
                          ? "hero-gradient text-white shadow-md scale-[1.02]"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nb users */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre d'utilisateurs : <span className="text-primary font-bold">{nbUsers}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={nbUsers}
                  onChange={(e) => setNbUsers(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                  style={{ background: `linear-gradient(to right, hsl(164 36% 44%) ${(nbUsers - 1) / 19 * 100}%, hsl(210 20% 92%) ${(nbUsers - 1) / 19 * 100}%)` }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              {/* Resultats */}
              <div className="pt-5 border-t border-border space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Prix unitaire</span>
                  <span className="text-lg font-bold text-foreground">{pu} EUR <span className="text-xs font-normal text-muted-foreground">/ mois</span></span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total mensuel</span>
                  <span className="text-3xl font-extrabold text-primary">{totalMois} EUR</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total annuel</span>
                  <span className="text-lg font-bold text-foreground">{totalAn} EUR <span className="text-xs font-normal text-muted-foreground">/ an</span></span>
                </div>
              </div>
            </div>

            <Button className="mt-6 w-full" size="lg" asChild>
              <a href="mailto:audreybousquet@abcarre.fr?subject=Devis%20ar.ia" className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Recevoir un devis personnalise
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Sources de donnees ────────────────────────────────────────── */}
      <section className="section-alt py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Sources de donnees</h2>
          <p className="text-muted-foreground text-center mb-8">Connectez vos outils metier — a ajouter a votre formule.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {SOURCES.map((s) => (
              <div key={s.nom} className="bg-card border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-foreground text-lg mb-1">{s.nom}</h3>
                <p className="text-muted-foreground text-sm mb-4">{s.desc}</p>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                  s.prix ? "bg-primary/10 text-primary" : "hero-gradient text-white"
                }`}>
                  {s.prix ? `+ ${s.prix} EUR / mois` : "Inclus"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Confiance ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-card border">
              <Shield className="h-8 w-8 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Heberge en France</h3>
                <p className="text-sm text-muted-foreground">Serveurs OVH, donnees conformes RGPD.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-card border">
              <Zap className="h-8 w-8 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Sans engagement</h3>
                <p className="text-sm text-muted-foreground">Resiliez a tout moment, sans justification.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-card border">
              <Star className="h-8 w-8 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Assistance incluse</h3>
                <p className="text-sm text-muted-foreground">Support reactif par email et telephone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="hero-gradient rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Pret a transformer vos donnees en decisions ?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Contactez-nous pour une demo personnalisee ou un devis adapte a votre equipe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <a href="mailto:audreybousquet@abcarre.fr" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Demander un devis
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <a href="tel:+33633490647" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  06 33 49 06 47
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tarifs;
