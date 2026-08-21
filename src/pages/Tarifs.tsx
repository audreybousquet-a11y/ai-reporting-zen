import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Minus, Calculator, Mail, Phone, Zap, Star, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* -- Donnees ----------------------------------------------------------- */

const FORMULES = [
  { id: "min" as const, nom: "MIN", desc: "Pour découvrir ar.ia", recommended: false },
  { id: "mid" as const, nom: "MID", desc: "Le plus populaire", recommended: true },
  { id: "max" as const, nom: "MAX", desc: "Performance maximale", recommended: false },
];

type FormulaId = "min" | "mid" | "max";

const FEATURES: { nom: string; min: boolean | string; mid: boolean | string; max: boolean | string }[] = [
  { nom: "Questions IA / mois", min: "50", mid: "200", max: "Illimité" },
  { nom: "Favoris", min: true, mid: true, max: true },
  { nom: "Dashboards", min: true, mid: true, max: true },
  { nom: "Fusion de sources (ETL)", min: false, mid: true, max: true },
  { nom: "Emails personnalisés", min: false, mid: false, max: true },
  { nom: "Alertes automatisées", min: false, mid: false, max: true },
];

const PRIX: Record<FormulaId, number> = { min: 29, mid: 34, max: 39 };

function prixUnitaire(nb: number, formule: FormulaId) {
  return PRIX[formule];
}

const SOURCES = [
  { id: "excel", nom: "Excel / Google Sheets", prix: 0, desc: "Importez vos fichiers Excel ou connectez un Google Sheet", inclus: true },
  { id: "deytime", nom: "DeyTime", prix: 5, desc: "Connecteur ERP DeyTime", inclus: false },
  { id: "extrabat", nom: "Extrabat", prix: 10, desc: "Connecteur ERP Extrabat", inclus: false },
  { id: "meteo", nom: "Open Météo", prix: 2, desc: "Données météo pour corréler avec votre activité", inclus: false },
  { id: "edf", nom: "EDF", prix: 2, desc: "Suivi de vos consommations et factures EDF", inclus: false },
  { id: "gmail", nom: "Gmail", prix: 2, desc: "Analyse et suivi de vos emails professionnels", inclus: false },
  { id: "facture_elec", nom: "Facture électronique", prix: 2, desc: "Import de factures XML (Factur-X, CII, UBL)", inclus: false },
];

/* -- Composants -------------------------------------------------------- */

type LicenceLine = { formule: FormulaId; nb: number };

const Tarifs = () => {
  const [lignes, setLignes] = useState<LicenceLine[]>([{ formule: "mid", nb: 1 }]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const nbUsersTotal = lignes.reduce((sum, l) => sum + l.nb, 0);
  const sourcesExtra = SOURCES.filter(s => !s.inclus && s.prix > 0 && selectedSources.includes(s.id)).reduce((sum, s) => sum + s.prix, 0);
  const totalLicences = lignes.reduce((sum, l) => sum + prixUnitaire(l.nb, l.formule) * l.nb, 0);
  const totalMois = totalLicences + sourcesExtra;
  const totalAn = totalMois * 12;

  const toggleSource = (id: string) => {
    setSelectedSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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

  // Construire le lien vers Souscrire avec les options
  const souscriptionUrl = `/souscrire?l=${lignes.map(l => l.formule + ":" + l.nb).join(",")}&options=${selectedSources.join(",")}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* -- Hero -- */}
      <section className="pt-28 pb-8 md:pt-36 md:pb-12">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Tarification transparente
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">
            Un prix simple,<br className="hidden md:block" /> adapté à votre équipe
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Par utilisateur, par mois. Sans engagement, sans surprise.
          </p>
        </div>
      </section>

      {/* -- Layout 3 colonnes : licences | sources | devis -- */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4" style={{ maxWidth: "1400px" }}>
          <div className="grid lg:grid-cols-3 gap-8">

            {/* === GAUCHE : Licences === */}
            <div>
              <div className="bg-card border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-11 w-11 rounded-xl hero-gradient flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">1. Licences</h2>
                </div>

                {/* Tableau comparatif */}
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-2 text-muted-foreground font-medium text-sm"></th>
                        {FORMULES.map(f => (
                          <th key={f.id} className="text-center py-2">
                            <span className={`text-sm font-bold uppercase ${f.recommended ? "text-primary" : "text-foreground"}`}>
                              {f.nom}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">{PRIX[f.id]} EUR HT/mois</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FEATURES.map(feat => (
                        <tr key={feat.nom} className="border-t border-border/50">
                          <td className="py-2.5 text-muted-foreground text-sm">{feat.nom}</td>
                          {(["min", "mid", "max"] as const).map(fid => {
                            const val = feat[fid];
                            return (
                              <td key={fid} className="text-center py-2.5">
                                {typeof val === "string" ? (
                                  <span className="font-semibold text-primary text-sm">{val}</span>
                                ) : val ? (
                                  <Check className="h-5 w-5 text-primary mx-auto" />
                                ) : (
                                  <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lignes de licences */}
                <div className="space-y-3">
                  {lignes.map((ligne, idx) => {
                    const pu = prixUnitaire(ligne.nb, ligne.formule);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          {(["min", "mid", "max"] as const).map(f => (
                            <button key={f} onClick={() => updateLigne(idx, "formule", f)}
                              className={`py-2 rounded-lg text-sm font-bold uppercase transition-all ${
                                ligne.formule === f ? "hero-gradient text-white shadow-sm" : "bg-muted text-muted-foreground"
                              }`}>{f}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateLigne(idx, "nb", Math.max(1, ligne.nb - 1))}
                            className="w-8 h-8 rounded-lg bg-muted text-muted-foreground font-bold text-base flex items-center justify-center hover:bg-muted/80">-</button>
                          <span className="w-7 text-center font-bold text-foreground text-base">{ligne.nb}</span>
                          <button onClick={() => updateLigne(idx, "nb", Math.min(20, ligne.nb + 1))}
                            className="w-8 h-8 rounded-lg bg-muted text-muted-foreground font-bold text-base flex items-center justify-center hover:bg-muted/80">+</button>
                        </div>
                        {lignes.length > 1 && (
                          <button onClick={() => removeLigne(idx)}
                            className="text-muted-foreground/40 hover:text-red-500 transition-colors text-xl leading-none">&times;</button>
                        )}
                      </div>
                    );
                  })}
                  <button onClick={addLigne}
                    className="w-full py-3 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
                    + Ajouter une formule
                  </button>
                </div>
              </div>
            </div>

            {/* === MILIEU : Sources === */}
            <div>
              <div className="bg-card border rounded-2xl p-8">
                <h2 className="text-xl font-bold text-foreground mb-2">2. Sources de données</h2>
                <p className="text-sm text-muted-foreground mb-5">Prix fixe par entreprise.</p>

                <div className="space-y-3">
                  {SOURCES.map(s => (
                    <label key={s.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        s.inclus
                          ? "border-primary bg-primary/5"
                          : selectedSources.includes(s.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                      }`}
                      onClick={s.inclus ? undefined : () => toggleSource(s.id)}
                    >
                      <input
                        type="checkbox"
                        checked={s.inclus || selectedSources.includes(s.id)}
                        disabled={s.inclus}
                        onChange={() => {}}
                        className="accent-primary h-4 w-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">{s.nom}</div>
                        <div className="text-xs text-muted-foreground">{s.desc}</div>
                      </div>
                      <span className={`text-sm font-semibold whitespace-nowrap ${s.prix === 0 ? "hero-gradient text-white px-2.5 py-1 rounded-full" : "text-primary"}`}>
                        {s.prix > 0 ? `+${s.prix} EUR` : "Inclus"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* === DROITE : Devis live === */}
            <div>
              <div className="bg-card border rounded-2xl p-8 lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Votre devis
                </h2>

                {/* Licences */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Licences</div>
                  {lignes.map((l, i) => {
                    const pu = prixUnitaire(l.nb, l.formule);
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{l.nb} utilisateur{l.nb > 1 ? "s" : ""} {l.formule.toUpperCase()}</span>
                        <span className="font-semibold text-foreground">{pu * l.nb} EUR HT</span>
                      </div>
                    );
                  })}
                </div>

                {/* Connecteurs */}
                {(selectedSources.length > 0 || true) && (
                  <div className="space-y-2 mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Connecteurs</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Excel / Google Sheets</span>
                      <span className="font-semibold text-green-600">Inclus</span>
                    </div>
                    {SOURCES.filter(s => !s.inclus && selectedSources.includes(s.id)).map(s => (
                      <div key={s.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{s.nom}</span>
                        <span className="font-semibold text-primary">{s.prix > 0 ? `+${s.prix} EUR HT` : "Inclus"}</span>
                      </div>
                    ))}
                    {selectedSources.length === 0 && (
                      <p className="text-xs text-muted-foreground/60 italic">Aucun connecteur optionnel</p>
                    )}
                  </div>
                )}

                <hr className="border-border my-4" />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-foreground">{nbUsersTotal} utilisateur{nbUsersTotal > 1 ? "s" : ""}</span>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-primary">{totalMois} EUR</span>
                      <span className="text-sm text-muted-foreground"> HT / mois</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total annuel</span>
                    <span className="font-bold text-foreground">{totalAn} EUR HT / an</span>
                  </div>
                </div>

                {/* CTA */}
                <Button className="mt-6 w-full animate-shimmer" size="lg" asChild>
                  <Link to={souscriptionUrl} className="flex items-center justify-center gap-2">
                    Souscrire — {totalMois} EUR HT / mois
                  </Link>
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-3">Sans engagement. Résiliez quand vous voulez.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- Confiance -- */}
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

      {/* -- CTA final -- */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="hero-gradient rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Prêt à transformer vos données en décisions ?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Contactez-nous pour une démo personnalisée ou un devis adapté à votre équipe.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <a href="/?demo=1#contact" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Demander une démo
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
