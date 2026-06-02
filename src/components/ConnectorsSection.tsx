const connectors = [
  { name: "Deytime", logo: "/logos/deytime2.webp", desc: "Connectez votre logiciel Deytime pour analyser heures, chantiers, absences et cagnotte de vos salari\u00e9s." },
  { name: "Extrabat", logo: "/logos/Extrabat.png", desc: "Reliez Extrabat pour exploiter vos devis, factures et donn\u00e9es clients du BTP." },
  { name: "Pennylane", logo: "/logos/pennylane.png", desc: "Importez vos donn\u00e9es comptables Pennylane pour suivre votre tr\u00e9sorerie et vos charges." },
  { name: "Facture \u00e9lectronique", logo: "/logos/facture_electronique.png", desc: "Importez vos factures aux formats CII, UBL et Factur-X (norme EN16931). Analyse automatique de vos achats, fournisseurs et \u00e9ch\u00e9ances." },
  { name: "Excel", logo: "/logos/Microsoft_Excel_2013-2019_logo.svg.png", desc: "Importez n\u2019importe quel fichier Excel et posez vos questions en langage naturel." },
  { name: "Google Sheets", logo: "/logos/google_sheets.svg", desc: "Connectez vos Google Sheets pour des donn\u00e9es toujours \u00e0 jour, synchronis\u00e9es automatiquement." },
  { name: "Gmail", logo: "/logos/fmail.png", desc: "Ajoutez vos emails et votre calendrier Google dans vos reportings." },
  { name: "Open-Meteo", logo: "/logos/openmeteo.jpg", desc: "Couplez vos donn\u00e9es avec la m\u00e9t\u00e9o journali\u00e8re de votre ville \u2014 temp\u00e9rature, pluie, vent." },
  { name: "EDF", logo: "/logos/edf.svg", desc: "Importez vos factures EDF en PDF pour suivre consommation et co\u00fbts \u00e9nerg\u00e9tiques." },
];

const doubled = [...connectors, ...connectors];

const ConnectorsSection = () => (
  <section className="py-16 md:py-20 overflow-hidden">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Connecteurs & Sources
        </h2>
        <p className="text-muted-foreground text-lg">
          ar.ia se connecte &agrave; vos outils m&eacute;tier et enrichit vos donn&eacute;es automatiquement.
        </p>
      </div>
      <div className="relative w-full">
        <div className="flex animate-scroll gap-12 w-max">
          {doubled.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="connector-item flex flex-col items-center justify-center min-w-[140px] group relative"
            >
              <div className="h-20 w-20 rounded-xl bg-card border shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                <img
                  src={c.logo}
                  alt={c.name}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {c.name}
              </span>
              <div className="connector-tooltip">
                {c.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <style>{`
      @keyframes scroll {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-scroll {
        animation: scroll 25s linear infinite;
      }
      .animate-scroll:hover {
        animation-play-state: paused;
      }
      .connector-tooltip {
        position: absolute;
        bottom: -60px;
        left: 50%;
        transform: translateX(-50%);
        background: #2d9583;
        color: #fff;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 0.8rem;
        line-height: 1.4;
        width: 220px;
        text-align: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .connector-tooltip::before {
        content: "";
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 6px solid #2d9583;
      }
      .connector-item:hover .connector-tooltip {
        opacity: 1;
      }
    `}</style>
  </section>
);

export default ConnectorsSection;
