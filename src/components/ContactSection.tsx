import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const EMAILJS_SERVICE_ID = "service_aria";
const EMAILJS_TEMPLATE_ID = "template_mx74oic";
const EMAILJS_PUBLIC_KEY = "B1PprkVPOIUU6Vjxh";

const ContactSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const templateParams = {
      from_prenom: data.get("prenom") as string,
      from_nom: data.get("nom") as string,
      from_email: data.get("email") as string,
      from_entreprise: data.get("entreprise") as string,
      message: data.get("message") as string,
      to_email: "audreybousquet@abcarre.fr",
    };

    try {
      const response = await fetch(
        `https://api.emailjs.com/api/v1.0/email/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: templateParams,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Message envoyé !",
          description: "Nous reviendrons vers vous rapidement.",
        });
        form.reset();
      } else {
        throw new Error("Échec de l'envoi");
      }
    } catch {
      const subject = encodeURIComponent(
        `Contact AR.IA — ${templateParams.from_prenom} ${templateParams.from_nom} (${templateParams.from_entreprise})`
      );
      const body = encodeURIComponent(
        `Prénom : ${templateParams.from_prenom}\nNom : ${templateParams.from_nom}\nEmail : ${templateParams.from_email}\nEntreprise : ${templateParams.from_entreprise}\n\nMessage :\n${templateParams.message}`
      );
      window.location.href = `mailto:audreybousquet@abcarre.fr?subject=${subject}&body=${body}`;
      toast({
        title: "Redirection vers votre client mail",
        description: "Votre message a été pré-rempli.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Prenons contact</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Découvrez AR.IA sur une démonstration préparée avec des données d'exemple, ou échangeons sur l'intégration dans votre système d'information. Remplissez le formulaire, nous vous recontactons sous 24h.
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
              <Input name="prenom" placeholder="Prénom" required />
              <Input name="nom" placeholder="Nom" required />
            </div>
            <Input name="email" type="email" placeholder="Email professionnel" required />
            <Input name="entreprise" placeholder="Entreprise" required />
            <Textarea name="message" placeholder="Votre message ou besoin..." rows={4} />
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
