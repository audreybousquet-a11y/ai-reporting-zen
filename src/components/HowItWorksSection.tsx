import { Database, MessageSquare, BarChart3 } from "lucide-react";

const steps = [
  { num: "1", icon: Database, title: "Connectez vos données", desc: "Reliez votre base de données en quelques clics. AR.IA crée automatiquement le modèle conceptuel.", examples: null },
  {
    num: "2", icon: MessageSquare, title: "Posez votre question", desc: "Formulez votre demande en langage naturel, comme vous le feriez à un collègue.",
    examples: [
      "Quel est mon CA par commercial en 2025 ?",
      "Quels sont mes 10 meilleurs clients ?",
      "Montre l'évolution des ventes par mois.",
    ]
  },
  { num: "3", icon: BarChart3, title: "Obtenez la réponse", desc: "Recevez instantanément un visuel clair — KPI, graphique ou tableau — exportable en Excel.", examples: null },
];

const HowItWorksSection = () => (
  <section id="how" className="py-20 md:py-28">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Comment ça marche</h2>
        <p className="text-muted-foreground text-lg">Trois étapes simples pour transformer vos données en décisions.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
        {steps.map((s) => (
          <div key={s.num} className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl hero-gradient flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
              <s.icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Étape {s.num}</span>
            <h3 className="font-semibold text-foreground text-lg mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.desc}</p>
            {s.examples && (
              <ul className="space-y-1.5 mt-3">
                {s.examples.map((ex) => (
                  <li key={ex} className="text-xs bg-secondary text-secondary-foreground rounded-lg px-3 py-1.5 italic">
                    « {ex} »
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
