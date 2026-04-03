import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Message envoyé !", description: "Nous reviendrons vers vous rapidement." });
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Demandez une démonstration</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Nos experts vous présentent AR.IA en conditions réelles sur vos propres données. Remplissez le formulaire, nous vous recontactons sous 24h.
            </p>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                audreybousquet@abcarre.fr
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                06 33 49 06 47
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Prénom" required />
              <Input placeholder="Nom" required />
            </div>
            <Input type="email" placeholder="Email professionnel" required />
            <Input placeholder="Entreprise" required />
            <Textarea placeholder="Votre message ou besoin..." rows={4} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer ma demande"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
