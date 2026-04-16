import { Database, BarChart3, Star, LayoutDashboard, Mail, BrainCircuit, Workflow } from "lucide-react";

const features = [
  { icon: Database, title: "Connexion automatique", desc: "Connectez votre source de données en quelques clics, sans compétence technique." },
  { icon: BrainCircuit, title: "Langage naturel", desc: "Posez vos questions comme à un collègue. L'IA comprend et génère la réponse." },
  { icon: BarChart3, title: "Visualisations multiples", desc: "KPI, graphiques, tableaux ou fiches récapitulatives avec export Excel." },
  { icon: Star, title: "Favoris & empreinte carbone", desc: "Sauvegardez vos visuels et limitez les requêtes inutiles pour un usage responsable." },
  { icon: LayoutDashboard, title: "Dashboards personnalisés", desc: "Regroupez vos favoris dans des tableaux de bord pour plus de lisibilité." },
  { icon: Mail, title: "Envoi de mails programmables", desc: "Partagez vos rapports avec vos contacts via des e-mails personnalisables." },
  { icon: Workflow, title: "ETL — Connexion multi-sources", desc: "Rassemblez plusieurs sources de données dans un même espace et interrogez-les ensemble, comme si elles n'en formaient qu'une." },
];

const FeaturesSection = () => (
  <section id="features" className="py-20 md:py-28 section-alt">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Fonctionnalités clés</h2>
        <p className="text-muted-foreground text-lg">Tout ce dont vos équipes ont besoin pour piloter l'activité en toute autonomie.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {features.map((f, i) => {
          const isLast = i === features.length - 1;
          const extra = isLast
            ? " md:col-span-2 md:max-w-sm md:mx-auto lg:col-span-1 lg:max-w-none lg:col-start-2"
            : "";
          return (
            <div key={f.title} className={"bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow" + extra}>
              <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default FeaturesSection;