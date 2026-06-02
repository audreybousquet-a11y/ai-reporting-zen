const connectors = [
  { name: "Deytime", logo: "/logos/deytime2.webp", desc: "Connectez votre logiciel Deytime pour analyser heures, chantiers, absences et cagnotte de vos salaries." },
  { name: "Extrabat", logo: "/logos/Extrabat.png", desc: "Reliez Extrabat pour exploiter vos devis, factures et donnees clients du BTP." },
  { name: "Pennylane", logo: "/logos/pennylane.png", desc: "Importez vos donnees comptables Pennylane pour suivre votre tresorerie et vos charges." },
  { name: "Facture electronique", logo: "/logos/facture_electronique.png", desc: "Importez vos factures aux formats CII, UBL et Factur-X (norme EN16931). Analyse automatique de vos achats, fournisseurs et echeances." },
  { name: "Excel", logo: "/logos/Microsoft_Excel_2013-2019_logo.svg.png", desc: "Importez n’importe quel fichier Excel et posez vos questions en langage naturel." },
  { name: "Google Sheets", logo: "/logos/google_sheets.svg", desc: "Connectez vos Google Sheets pour des donnees toujours a jour, synchronisees automatiquement." },
  { name: "Gmail", logo: "/logos/fmail.png", desc: "Ajoutez vos emails et votre calendrier Google dans vos reportings." },
  { name: "Open-Meteo", logo: "/logos/openmeteo.jpg", desc: "Couplez vos donnees avec la meteo journaliere de votre ville — temperature, pluie, vent." },
  { name: "EDF", logo: "/logos/edf.svg", desc: "Importez vos factures EDF en PDF pour suivre consommation et couts energetiques." },
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
          ar.ia se connecte a vos outils metier et enrichit vos donnees automatiquement.
        </p>
      </div>
      <div className="relative w-full">
        <div className="flex animate-scroll gap-12 w-max">
          {doubled.map((c, i) => (
            <div
              key={}
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
    <style>{}</style>
  </section>
);

export default ConnectorsSection;
