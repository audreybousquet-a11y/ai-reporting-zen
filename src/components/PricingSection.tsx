import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "490€",
    period: "/mois",
    desc: "Pour les petites équipes qui débutent avec la data.",
    features: ["1 source de données", "3 utilisateurs", "Requêtes illimitées", "Export Excel", "Support email"],
    highlighted: false,
  },
  {
    name: "Business",
    price: "990€",
    period: "/mois",
    desc: "Pour les entreprises qui veulent piloter leur activité.",
    features: ["Sources illimitées", "10 utilisateurs", "Dashboards personnalisés", "Envoi de mails programmé", "Support prioritaire"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    period: "",
    desc: "Pour les organisations aux besoins spécifiques.",
    features: ["Déploiement dédié", "Utilisateurs illimités", "SSO & sécurité avancée", "IA française souveraine", "Account manager dédié"],
    highlighted: false,
  },
];

const PricingSection = () => (
  <section id="pricing" className="py-20 md:py-28 section-alt">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Tarifs transparents</h2>
        <p className="text-muted-foreground text-lg">Des formules adaptées à chaque taille d'entreprise.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl p-8 border flex flex-col ${
              p.highlighted
                ? "bg-card border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                : "bg-card shadow-sm"
            }`}
          >
            {p.highlighted && (
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Populaire</span>
            )}
            <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
            <div className="mt-4 mb-2">
              <span className="text-4xl font-extrabold text-foreground">{p.price}</span>
              <span className="text-muted-foreground text-sm">{p.period}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{p.desc}</p>
            <ul className="space-y-3 mb-8 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant={p.highlighted ? "default" : "outline"} className="w-full" asChild>
              <a href="#contact">{p.price === "Sur mesure" ? "Nous contacter" : "Commencer"}</a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
