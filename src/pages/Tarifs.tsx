import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Minus, Calculator, Mail, Phone, Zap, Star, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ── Donnees ────────────────────────────────────────────────────────────── */

const FORMULES = [
  {
    id: "min" as const, nom: "MIN", desc: "Pour découvrir ar.ia",
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
  { nom: "Emails automatisés",   min: false,   mid: false,  max: true },
];

const PRIX: Record<string, Record<FormulaId, number>> = {
  "1":   { min: 29, mid: 34, max: 39 },
  "2-4": { min: 25, mid: 29, max: 34 },
  "5+":  { min: 23, mid: 24, max: 29 },
};

const TRANCHES = [
  { key: "1",   label: "1 utilisateur" },
  { key: "2-4", label: "2 à 4 utilisateurs" },
  { key: "5+",  label: "5 et plus" },
];

function prixUnitaire(nb: number, formule: FormulaId) {
  if (nb >= 5) return PRIX["5+"][formule];
  if (nb >= 2) return PRIX["2-4"][formule];
  return PRIX["1"][formule];
}

const SOURCES = [
  { nom: "Excel / Google Sheets",  prix: null,  icon: "table", desc: "Importez vos fichiers Excel ou connectez un Google Sheet" },
  { nom: "DeyTime",  prix: 5,     icon: "link",  desc: "Connecteur ERP DeyTime" },
  { nom: "Extrabat", prix: 10,    icon: "build", desc: "Connecteur ERP Extrabat" },
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

type LicenceLine = { formule: FormulaId; nb: number };

const Tarifs = () => {
  const [lignes, setLignes] = useState<LicenceLine[]>([{ formule: "mid", nb: 1 }]);
  const [annuel, setAnnuel] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // Pour le scroll depuis les cartes
  const [formule, setFormule] = useState<FormulaId>("mid");

  const nbUsersTotal = lignes.reduce((sum, l) => sum + l.nb, 0);
  const sourcesExtraParUser = SOURCES.filter((s) => s.prix && selectedSources.includes(s.nom)).reduce((sum, s) => sum + (s.prix || 0), 0);
  const sourcesExtra = sourcesExtraParUser * nbUsersTotal;
  const totalLicences = lignes.reduce((sum, l) => sum + prixUnitaire(l.nb, l.formule) * l.nb, 0);
  const totalMois = totalLicences + sourcesExtra;
  const totalAn   = totalMois * 12;

  const toggleSource = (nom: string) => {
    setSelectedSources((prev) =>
      prev.includes(nom) ? prev.filter((s) => s !== nom) : [...prev, nom]
    );
  };

  const updateLigne = (idx: number, field: keyof LicenceLine, value: any) => {
    setLignes(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const addLigne = () => {
    setLignes(prev => [...prev, { formule: "min", nb: 1 }]);
  };

  const removeLigne = (idx: number) => {
    setLignes(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));
  };

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
            Un prix simple,<br className="hidden md:block" /> adapté à votre équipe
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Par utilisateur, par mois. Des remises automatiques dès 2 utilisateurs.
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
                        <Star className="h-3.5 w-3.5" /> Recommandé
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
                            {typeof val === "string" && (
                              <span className="mr-1.5 font-semibold text-primary">{val}</span>
                            )}
                            {feat.nom}
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
                    <a href="#calculateur" onClick={() => { setLignes([{ formule: f.id, nb: 1 }]); setFormule(f.id); }}>
                      {isReco ? "Démarrer maintenant" : "Souscrire"}
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Sources de données ────────────────────────────────────────── */}
      <section className="section-alt py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Sources de données</h2>
          <p className="text-muted-foreground text-center mb-8">Connectez vos outils métier — à ajouter à votre formule.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {SOURCES.map((s) => (
              <div key={s.nom} className="bg-card border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-lg">{s.nom.charAt(0)}</span>
                </div>
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

      {/* ── Grille dégressive ─────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Tarifs dégressifs</h2>
          <p className="text-muted-foreground text-center mb-8">Plus vous êtes nombreux, moins c'est cher.</p>

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

      {/* ── Calculateur multi-lignes ─────────────────────────────────── */}
      <section className="py-16 md:py-20" id="calculateur">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl hero-gradient flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Estimez votre budget</h2>
                <p className="text-xs text-muted-foreground">Combinez les formules selon vos besoins</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Lignes de licences */}
              {lignes.map((ligne, idx) => {
                const pu = prixUnitaire(ligne.nb, ligne.formule);
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      {(["min", "mid", "max"] as const).map(f => (
                        <button key={f} onClick={() => updateLigne(idx, "formule", f)}
                          className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                            ligne.formule === f ? "hero-gradient text-white shadow-sm" : "bg-muted text-muted-foreground"
                          }`}>{f}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateLigne(idx, "nb", Math.max(1, ligne.nb - 1))}
                        className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-bold text-sm flex items-center justify-center hover:bg-muted/80">-</button>
                      <span className="w-6 text-center font-bold text-foreground text-sm">{ligne.nb}</span>
                      <button onClick={() => updateLigne(idx, "nb", Math.min(20, ligne.nb + 1))}
                        className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-bold text-sm flex items-center justify-center hover:bg-muted/80">+</button>
                    </div>
                    <span className="w-20 text-right font-semibold text-foreground text-sm">{pu * ligne.nb} EUR</span>
                    {lignes.length > 1 && (
                      <button onClick={() => removeLigne(idx)}
                        className="text-muted-foreground/40 hover:text-red-500 transition-colors text-lg leading-none">&times;</button>
                    )}
                  </div>
                );
              })}

              <button onClick={addLigne}
                className="w-full py-2 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
                + Ajouter une formule
              </button>

              {/* Sources / API */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sources de données</label>
                <p className="text-xs text-muted-foreground mb-3">Importez vos fichiers Excel et/ou connectez vos Google Sheets.</p>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-primary bg-primary/5">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={true} disabled className="accent-primary h-4 w-4" />
                      <span className="text-sm font-medium text-foreground">Excel / Google Sheets</span>
                    </div>
                    <span className="text-sm font-semibold hero-gradient text-white px-2 py-0.5 rounded-full">Inclus</span>
                  </label>
                  {SOURCES.filter((s) => s.prix).map((s) => (
                    <label key={s.nom} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSources.includes(s.nom) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedSources.includes(s.nom)}
                          onChange={() => toggleSource(s.nom)} className="accent-primary h-4 w-4" />
                        <span className="text-sm font-medium text-foreground">{s.nom}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">+ {s.prix} EUR / mois / utilisateur</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="pt-4 border-t border-border space-y-2">
                {lignes.map((ligne, idx) => {
                  const pu = prixUnitaire(ligne.nb, ligne.formule);
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{ligne.nb} utilisateur{ligne.nb > 1 ? "s" : ""} {ligne.formule.toUpperCase()} x {pu} EUR</span>
                      <span className="font-semibold text-foreground">{pu * ligne.nb} EUR</span>
                    </div>
                  );
                })}
                {sourcesExtra > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{selectedSources.join(" + ")} ({sourcesExtraParUser} EUR x {nbUsersTotal} util.)</span>
                    <span className="font-semibold text-primary">+ {sourcesExtra} EUR</span>
                  </div>
                )}
                <hr className="border-border" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-foreground">{nbUsersTotal} utilisateur{nbUsersTotal > 1 ? "s" : ""} au total</span>
                  <span className="text-3xl font-extrabold text-primary">{totalMois} EUR<span className="text-sm font-normal text-muted-foreground"> / mois</span></span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total annuel</span>
                  <span className="font-bold text-foreground">{totalAn} EUR / an</span>
                </div>
              </div>
            </div>

            <Button className="mt-6 w-full animate-shimmer" size="lg" asChild>
              <Link to={`/souscrire?l=${lignes.map(l => l.formule + ":" + l.nb).join(",")}&options=${selectedSources.join(",")}`} className="flex items-center justify-center gap-2">
                Souscrire — {totalMois} EUR / mois
              </Link>
            </Button>
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
                <h3 className="font-semibold text-foreground mb-1">Hébergé en France</h3>
                <p className="text-sm text-muted-foreground">Serveurs OVH, données conformes RGPD.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-card border">
              <Zap className="h-8 w-8 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Sans engagement</h3>
                <p className="text-sm text-muted-foreground">Résiliez à tout moment, sans justification.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-xl bg-card border">
              <Star className="h-8 w-8 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Assistance incluse</h3>
                <p className="text-sm text-muted-foreground">Support réactif par email et téléphone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="hero-gradient rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Prêt à transformer vos données en décisions ?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Contactez-nous pour une démo personnalisée ou un devis adapté à votre équipe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <a href="mailto:audreybousquet@abcarre.fr" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Demander un devis
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 bg-white/10" asChild>
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
