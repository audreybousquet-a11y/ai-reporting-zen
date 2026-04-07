import { ShieldCheck, MapPin, Lock, BrainCircuit } from "lucide-react";

const items = [
  {
    icon: Lock,
    title: "Données non stockées",
    desc: "Vos données ne transitent par l'IA que le temps d'une requête. Elles ne sont jamais conservées ni utilisées pour entraîner un modèle.",
  },
  {
    icon: MapPin,
    title: "Hébergé en France",
    desc: "Serveurs OVH à Strasbourg, sous juridiction française. Aucune donnée ne sort du territoire national.",
  },
  {
    icon: BrainCircuit,
    title: "IA française — Mistral",
    desc: "AR.IA s'appuie sur Mistral, le modèle d'intelligence artificielle français de référence. Performances de pointe, souveraineté garantie.",
  },
  {
    icon: ShieldCheck,
    title: "Conforme RGPD",
    desc: "Conçu pour satisfaire les exigences de vos DPO. Un argument fort pour déployer l'IA en entreprise en toute sérénité.",
  },
];

const TrustSection = () => (
  <section className="py-16 md:py-20 section-alt">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">Made in France</span>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Vos données restent les vôtres</h2>
        <p className="text-muted-foreground">Une IA responsable, souveraine et conforme — pensée pour les entreprises qui ne font pas de compromis sur la confidentialité.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col items-center text-center bg-card rounded-xl p-6 border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
