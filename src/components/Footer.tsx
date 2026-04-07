import logoColor from "@/assets/logo-aria.png";
import logoBlanc from "@/assets/Logo_blanc.png";
import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer>
    {/* Bandeau vert principal */}
    <div className="bg-primary text-primary-foreground py-14 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10 items-start">

          {/* Logo + tagline */}
          <div>
            <img src={logoBlanc} alt="AR.IA" className="h-14 mb-4" />
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
              L'assistant IA de reporting made in France — souverain, conforme RGPD, pensé pour vos équipes métier.
            </p>
          </div>

          {/* Coordonnées */}
          <div>
            <h3 className="font-semibold text-base mb-4">Contact</h3>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:audreybousquet@abcarre.fr" className="hover:text-primary-foreground transition-colors">
                  audreybousquet@abcarre.fr
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+33633490647" className="hover:text-primary-foreground transition-colors">
                  06 33 49 06 47
                </a>
              </div>
              <p className="pt-1">AB Carré<br />France</p>
            </div>
          </div>

          {/* Liens légaux */}
          <div>
            <h3 className="font-semibold text-base mb-4">Informations légales</h3>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <div>
                <Link to="/mentions-legales" className="hover:text-primary-foreground transition-colors">
                  Mentions légales
                </Link>
              </div>
              <div>
                <Link to="/politique-confidentialite" className="hover:text-primary-foreground transition-colors">
                  Politique de confidentialité
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    {/* Barre copyright */}
    <div className="bg-primary/90 text-primary-foreground/60 py-4 text-center text-xs">
      © {new Date().getFullYear()} AR.IA by AB Carré. Tous droits réservés.
    </div>
  </footer>
);

export default Footer;
