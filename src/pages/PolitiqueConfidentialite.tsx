import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-aria.png";

const PolitiqueConfidentialite = () => (
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
      <h1 className="text-3xl font-bold text-foreground mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : avril 2026</p>

      <section className="space-y-8 text-sm text-muted-foreground leading-relaxed">

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Responsable du traitement</h2>
          <p>
            <strong>AB Carré</strong> — Audrey Bousquet<br />
            Email : <a href="mailto:audreybousquet@abcarre.fr" className="text-primary hover:underline">audreybousquet@abcarre.fr</a><br />
            Téléphone : 06 33 49 06 47
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Données collectées</h2>
          <p>
            Dans le cadre du formulaire de contact présent sur ce site, nous collectons les informations suivantes :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Prénom et nom</li>
            <li>Adresse email professionnelle</li>
            <li>Nom de l'entreprise</li>
            <li>Message libre</li>
          </ul>
          <p className="mt-2">
            Ces données sont utilisées uniquement pour répondre à votre demande et ne font l'objet d'aucune
            transmission à des tiers ni d'aucune utilisation commerciale.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Données de l'application AR.IA</h2>
          <p>
            AR.IA est conçu selon le principe de <strong>minimisation des données</strong> :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Vos données métier ne transitent par le modèle d'intelligence artificielle que le temps d'une requête.</li>
            <li>Elles ne sont jamais stockées sur les serveurs de l'éditeur du modèle IA.</li>
            <li>Elles ne sont pas utilisées pour entraîner ou améliorer le modèle.</li>
            <li>L'ensemble du traitement est réalisé sur des serveurs hébergés en France (OVH, Strasbourg).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Connexion aux services Google (Gmail, Google Agenda)</h2>
          <p>
            AR.IA propose une fonctionnalit&#233; optionnelle de connexion &#224; votre compte Google
            pour importer des donn&#233;es depuis Gmail et Google Agenda. Cette connexion est soumise
            &#224; votre consentement explicite via le protocole OAuth2 de Google.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Donn&#233;es Gmail</strong> : seules les m&#233;tadonn&#233;es de vos emails sont r&#233;cup&#233;r&#233;es
              (exp&#233;diteur, destinataire, date, objet, labels). Le contenu des emails n&#8217;est jamais lu ni stock&#233;.</li>
            <li><strong>Donn&#233;es Google Agenda</strong> : seules les informations de vos &#233;v&#233;nements sont r&#233;cup&#233;r&#233;es
              (titre, date, dur&#233;e, lieu, participants). Le contenu des notes n&#8217;est pas lu.</li>
            <li>Ces donn&#233;es sont stock&#233;es dans une base de donn&#233;es locale d&#233;di&#233;e &#224; votre compte utilisateur,
              h&#233;berg&#233;e sur nos serveurs en France (OVH, Strasbourg).</li>
            <li>Elles ne sont jamais partag&#233;es avec des tiers.</li>
            <li>Vous pouvez r&#233;voquer l&#8217;acc&#232;s &#224; tout moment depuis les param&#232;tres de votre compte AR.IA
              ou depuis votre compte Google (myaccount.google.com/permissions).</li>
            <li>La suppression de votre compte AR.IA entra&#238;ne la suppression de toutes les donn&#233;es Google associ&#233;es.</li>
          </ul>
          <p className="mt-2">
            L&#8217;utilisation et le transfert des informations re&#231;ues via les API Google respectent la{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              politique de donn&#233;es utilisateur des services API Google
            </a>, y compris les exigences d&#8217;utilisation limit&#233;e (Limited Use).
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Dur&#233;e de conservation</h2>
          <p>
            Les donn&#233;es transmises via le formulaire de contact sont conserv&#233;es le temps n&#233;cessaire
            au traitement de votre demande, et au maximum 12 mois.
            Les donn&#233;es import&#233;es depuis Google sont conserv&#233;es tant que votre compte AR.IA est actif
            et que l&#8217;autorisation Google n&#8217;est pas r&#233;voqu&#233;e.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Vos droits</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit d'opposition</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, contactez-nous à :{" "}
            <a href="mailto:audreybousquet@abcarre.fr" className="text-primary hover:underline">
              audreybousquet@abcarre.fr
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Cookies</h2>
          <p>
            Ce site n'utilise pas de cookies de traçage ou publicitaires. Seuls des cookies techniques
            strictement nécessaires au fonctionnement du site peuvent être déposés.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground mb-2">Contact DPO</h2>
          <p>
            Pour toute question relative à la protection de vos données personnelles :<br />
            <a href="mailto:audreybousquet@abcarre.fr" className="text-primary hover:underline">
              audreybousquet@abcarre.fr
            </a>
          </p>
        </div>

      </section>
    </main>
  </div>
);

export default PolitiqueConfidentialite;
