import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import screenshot from "@/assets/localhost_85012_.png";

const HeroSection = () => (
  <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
    <div className="absolute inset-0 hero-gradient opacity-[0.04]" />
    <div className="container mx-auto px-4 relative">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground mb-6">
          <MessageSquare className="h-4 w-4" />
          Assistant IA pour le reporting
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
          Posez la bonne question,{" "}
          <span className="text-primary">ar.ia</span> se charge du reste
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Interrogez vos données métier en langage naturel. Obtenez des KPI, graphiques et tableaux de bord en quelques secondes — sans compétence technique.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="text-base px-8" asChild>
            <a href="#contact">
              Demander une démonstration
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8" asChild>
            <a href="#how">Découvrir le fonctionnement</a>
          </Button>
        </div>
      </div>
      <div className="mt-16 flex justify-center">
        <img
          src={screenshot}
          alt="Aperçu de l'interface AR.IA"
          className="rounded-2xl shadow-2xl shadow-primary/20 border border-border w-full max-w-4xl"
        />
      </div>
    </div>
  </section>
);

export default HeroSection;
