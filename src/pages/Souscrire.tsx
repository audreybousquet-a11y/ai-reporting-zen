import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Mail, Loader2, ArrowLeft, PartyPopper, Lock, Construction, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ── Gate mot de passe (même que Tarifs) ────────────────────────────────── */

const GATE_PASSWORD = "aria2024";

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === GATE_PASSWORD) {
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-36 pb-20">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="h-20 w-20 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-8">
            <Construction className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-3">Page en construction</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Nous travaillons sur notre grille tarifaire.<br />
            Contactez-nous pour un devis personnalisé.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Button variant="default" size="lg" asChild>
              <a href="mailto:audreybousquet@abcarre.fr" className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Demander un devis
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="tel:+33633490647" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> 06 33 49 06 47
              </a>
            </Button>
          </div>

          <div className="border-t pt-8">
            <form onSubmit={handleSubmit} className="max-w-xs mx-auto">
              <label className="flex items-center gap-2 text-sm text-muted-foreground mb-3 justify-center">
                <Lock className="h-3.5 w-3.5" /> Accès réservé
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Mot de passe"
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
                    error ? "border-red-400 bg-red-50" : "border-input focus:border-primary focus:ring-2 focus:ring-primary/30"
                  }`}
                />
                <Button type="submit" size="default">OK</Button>
              </div>
              {error && <p className="text-red-500 text-xs mt-2">Mot de passe incorrect</p>}
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

type FormulaId = "min" | "mid" | "max";

const PRIX: Record<string, Record<FormulaId, number>> = {
  "1":   { min: 29, mid: 34, max: 39 },
  "2-4": { min: 25, mid: 29, max: 34 },
  "5+":  { min: 23, mid: 24, max: 29 },
};

function prixUnitaire(nb: number, formule: FormulaId) {
  if (nb >= 5) return PRIX["5+"][formule];
  if (nb >= 2) return PRIX["2-4"][formule];
  return PRIX["1"][formule];
}

const SOURCES_OPTIONS = [
  { id: "deytime", nom: "DeyTime", prix: 5 },
  { id: "extrabat", nom: "Extrabat", prix: 10 },
];

type Step = "form" | "payment" | "processing" | "success";

type LicenceLine = { formule: FormulaId; nb: number };

const Souscrire = () => {
  // Récupérer les paramètres du simulateur
  const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const parsedLignes: LicenceLine[] = (() => {
    try {
      const raw = qs?.get("l") || "";
      if (!raw) return [{ formule: "mid" as FormulaId, nb: 1 }];
      return raw.split(",").map(p => {
        const parts = p.split(":");
        return { formule: (parts[0] || "mid") as FormulaId, nb: parseInt(parts[1]) || 1 };
      });
    } catch { return [{ formule: "mid" as FormulaId, nb: 1 }]; }
  })();
  const parsedOptions = (qs?.get("options") || "").split(",").filter(Boolean);

  const [step, setStep] = useState<Step>("form");
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const [lignes, setLignes] = useState<LicenceLine[]>(parsedLignes);
  const [options, setOptions] = useState<string[]>(parsedOptions);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [telephone, setTelephone] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const nbUsersTotal = lignes.reduce((sum, l) => sum + l.nb, 0);
  // Connecteurs = prix fixe par entreprise
  const sourcesExtra = SOURCES_OPTIONS.filter(s => options.includes(s.id)).reduce((sum, s) => sum + s.prix, 0);
  const totalLicences = lignes.reduce((sum, l) => sum + prixUnitaire(l.nb, l.formule) * l.nb, 0);
  const totalMois = totalLicences + sourcesExtra;

  const toggleOption = (id: string) => {
    setOptions(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);
  };

  const handleSubscribe = async () => {
    setStep("processing");
    setError("");
    try {
      const resp = await fetch("https://dev.ar-ia.fr/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom, email, entreprise, telephone, lignes, nb_users: nbUsersTotal, formule: lignes[0]?.formule || "mid", options }),
      });
      const data = await resp.json();
      if (data.success) {
        setResult(data);
        setStep("success");
      } else {
        setError(data.error || "Erreur lors de la souscription");
        setStep("payment");
      }
    } catch (e) {
      setError("Erreur de connexion. Veuillez réessayer.");
      setStep("payment");
    }
  };

  return (
    <PasswordGate>
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="container mx-auto px-4 max-w-2xl">

          {/* ── Étape 1 : Formulaire ──────────────────────────────── */}
          {step === "form" && (
            <div>
              <Link to="/tarifs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="h-4 w-4" /> Retour aux tarifs
              </Link>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">Souscrire à ar.ia</h1>
              <p className="text-muted-foreground mb-8">Créez votre compte en quelques minutes.</p>

              <div className="space-y-6">
                {/* Licences */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Vos licences</label>
                  <div className="space-y-2">
                    {lignes.map((ligne, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background">
                        <div className="flex-1 grid grid-cols-3 gap-1">
                          {(["min", "mid", "max"] as const).map(f => (
                            <button key={f} onClick={() => setLignes(prev => prev.map((l, i) => i === idx ? { ...l, formule: f } : l))}
                              className={`py-1.5 rounded-lg text-xs font-bold uppercase ${
                                ligne.formule === f ? "hero-gradient text-white" : "bg-muted text-muted-foreground"
                              }`}>{f}</button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setLignes(prev => prev.map((l, i) => i === idx ? { ...l, nb: Math.max(1, l.nb - 1) } : l))}
                            className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-bold text-sm flex items-center justify-center">-</button>
                          <span className="w-6 text-center font-bold text-sm">{ligne.nb}</span>
                          <button onClick={() => setLignes(prev => prev.map((l, i) => i === idx ? { ...l, nb: l.nb + 1 } : l))}
                            className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-bold text-sm flex items-center justify-center">+</button>
                        </div>
                        <span className="w-16 text-right font-semibold text-sm">{prixUnitaire(ligne.nb, ligne.formule) * ligne.nb} EUR</span>
                        {lignes.length > 1 && (
                          <button onClick={() => setLignes(prev => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground/40 hover:text-red-500 text-lg">&times;</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setLignes(prev => [...prev, { formule: "min", nb: 1 }])}
                      className="w-full py-2 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5">
                      + Ajouter une formule
                    </button>
                  </div>
                </div>

                {/* Options sources — par entreprise */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Connecteurs</label>
                  <p className="text-xs text-muted-foreground mb-3">Prix fixe par entreprise, quel que soit le nombre d'utilisateurs.</p>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-primary bg-primary/5 mb-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={true} disabled className="accent-primary h-4 w-4" />
                      <span className="text-sm font-medium text-foreground">Excel / Google Sheets</span>
                    </div>
                    <span className="text-sm font-semibold hero-gradient text-white px-2 py-0.5 rounded-full">Inclus</span>
                  </label>
                  {SOURCES_OPTIONS.map(s => (
                    <label key={s.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all mb-2 ${
                      options.includes(s.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={options.includes(s.id)} onChange={() => toggleOption(s.id)} className="accent-primary h-4 w-4" />
                        <span className="text-sm font-medium">{s.nom}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">+ {s.prix} EUR / mois</span>
                    </label>
                  ))}
                </div>

                <hr className="border-border" />

                {/* Informations personnelles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Prénom *</label>
                    <input value={prenom} onChange={e => setPrenom(e.target.value)}
                      className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Nom *</label>
                    <input value={nom} onChange={e => setNom(e.target.value)}
                      className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email professionnel *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Entreprise *</label>
                  <input value={entreprise} onChange={e => setEntreprise(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                  <input value={telephone} onChange={e => setTelephone(e.target.value)}
                    className="w-full rounded-lg border border-input px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                </div>

                {/* Récap */}
                <div className="bg-card border rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground mb-3">Récapitulatif</h3>
                  {lignes.map((l, i) => {
                    const lpu = prixUnitaire(l.nb, l.formule);
                    return (
                      <div key={i} className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{l.nb} utilisateur{l.nb > 1 ? "s" : ""} {l.formule.toUpperCase()} x {lpu} EUR</span>
                        <span className="font-semibold">{lpu * l.nb} EUR</span>
                      </div>
                    );
                  })}
                  {SOURCES_OPTIONS.filter(s => options.includes(s.id)).map(s => (
                    <div key={s.id} className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{s.nom}</span>
                      <span className="font-semibold text-primary">+ {s.prix} EUR</span>
                    </div>
                  ))}
                  <hr className="my-3 border-border" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total mensuel</span>
                    <span className="text-2xl font-extrabold text-primary">{totalMois} EUR</span>
                  </div>
                </div>

                <Button size="lg" className="w-full" disabled={!prenom || !nom || !email || !entreprise}
                  onClick={() => setStep("payment")}>
                  Continuer vers le paiement
                </Button>
              </div>
            </div>
          )}

          {/* ── Étape 2 : Paiement (simulé) ───────────────────────── */}
          {step === "payment" && (
            <div>
              <button onClick={() => setStep("form")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="h-4 w-4" /> Modifier mes informations
              </button>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">Paiement</h1>
              <p className="text-muted-foreground mb-8">{totalMois} EUR / mois — {nbUsersTotal} utilisateur{nbUsersTotal > 1 ? "s" : ""} ({lignes.map(l => `${l.nb} ${l.formule.toUpperCase()}`).join(" + ")})</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
              )}

              <div className="bg-card border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-foreground">Informations de paiement</h3>
                </div>

                {/* Simulation Stripe */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Numéro de carte</label>
                    <input defaultValue="4242 4242 4242 4242" disabled
                      className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Expiration</label>
                      <input defaultValue="12/28" disabled
                        className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">CVC</label>
                      <input defaultValue="123" disabled
                        className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
                  <strong>Mode test</strong> — Aucun paiement réel ne sera effectué. Le compte sera créé immédiatement.
                </div>

                <Button size="lg" className="w-full" onClick={handleSubscribe}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Valider et créer mon compte ({totalMois} EUR / mois)
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Paiement sécurisé par Stripe · Sans engagement · Résiliable à tout moment
              </p>
            </div>
          )}

          {/* ── Étape 3 : Processing ──────────────────────────────── */}
          {step === "processing" && (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-foreground mb-2">Création de votre compte en cours...</h2>
              <p className="text-muted-foreground">Configuration de votre espace, envoi des emails...</p>
            </div>
          )}

          {/* ── Étape 4 : Succès ──────────────────────────────────── */}
          {step === "success" && result && (
            <div className="text-center">
              <div className="h-20 w-20 rounded-full hero-gradient flex items-center justify-center mx-auto mb-6">
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">Bienvenue sur ar.ia !</h1>
              <p className="text-muted-foreground mb-8">Votre compte a été créé avec succès.</p>

              <div className="bg-card border rounded-2xl p-6 text-left max-w-md mx-auto mb-8">
                <h3 className="font-semibold text-foreground mb-4">Vos identifiants de connexion</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Adresse</span>
                    <a href="https://dev.ar-ia.fr" className="text-sm font-semibold text-primary">dev.ar-ia.fr</a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Identifiant</span>
                    <span className="text-sm font-semibold text-foreground">{result.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mot de passe</span>
                    <button onClick={() => {navigator.clipboard.writeText(result.password); alert("Mot de passe copié !")}}
                      className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-lg hover:bg-primary/20 cursor-pointer transition-colors"
                      title="Cliquer pour copier">{result.password} 📋</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <a href="https://dev.ar-ia.fr">Se connecter à ar.ia</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/tarifs">Retour aux tarifs</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                <Mail className="h-4 w-4 inline mr-1" />
                Un email de confirmation a été envoyé à <strong>{result.email}</strong>
              </p>

              {options.includes("deytime") && (
                <p className="text-sm text-primary mt-2">
                  🔗 Le connecteur Deytime sera activé sous 24-48h. Vous recevrez un email de confirmation.
                </p>
              )}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
    </PasswordGate>
  );
};

export default Souscrire;
