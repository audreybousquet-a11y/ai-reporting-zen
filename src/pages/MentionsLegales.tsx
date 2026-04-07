import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-aria.png";

const MentionsLegales = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <img src={logo} alt="AR.IA" className="h-7 ml-2" />
      </div>
    </header>

    <main className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Mentions légales</h1>

      <section className="space-y-8 text-sm text-muted-foreground leading-relaxed">

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Éditeur du site</h2>
          <p>
            Le site <strong>ar-ia.fr</strong> est édité par <strong>AB Carré</strong>,
            représentée par Audrey Bousquet.<br />
            Email : <a href="mailto:audreybousquet@abcarre.fr" className="text-primary hover:underline">audreybousquet@abcarre.fr</a><br />
            Téléphone : 06 33 49 06 47
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Responsable de la publication</h2>
          <p>Audrey Bousquet — audreybousquet@abcarre.fr</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Hébergement du site vitrine</h2>
          <p>
            Le site vitrine ar-ia.fr est hébergé par :<br />
            <strong>Vercel Inc.</strong><br />
            340 Pine Street, Suite 1601<br />
            San Francisco, CA 94104 — États-Unis<br />
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a>
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Hébergement de l'application</h2>
          <p>
            L'application app.ar-ia.fr est hébergée sur un serveur :<br />
            <strong>OVH SAS</strong><br />
            2 rue Kellermann, 59100 Roubaix — France<br />
            Datacenter : Strasbourg, France<br />
            <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ovhcloud.com</a>
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (textes, graphismes, logo, icônes) est la propriété exclusive d'AB Carré
            et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
            Toute reproduction, même partielle, est strictement interdite sans autorisation préalable écrite.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Limitation de responsabilité</h2>
          <p>
            AB Carré s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site.
            Toutefois, AB Carré ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations
            mises à la disposition sur ce site et décline toute responsabilité pour toute imprécision,
            inexactitude ou omission portant sur des informations disponibles sur ce site.
          </p>
        </div>

      </section>
    </main>
  </div>
);

export default MentionsLegales;
