const connectors = [
  {
    name: "Deytime",
    logo: "https://www.deytime.fr/wp-content/uploads/2023/01/logo-deytime.svg",
    alt: "Deytime - Gestion du temps BTP",
  },
  {
    name: "Extrabat",
    logo: "https://www.extrabat.com/images/logo-extrabat.svg",
    alt: "Extrabat - Logiciel BTP",
  },
  {
    name: "Pennylane",
    logo: "https://logo.clearbit.com/pennylane.com",
    alt: "Pennylane - Comptabilité",
  },
  {
    name: "Excel",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg",
    alt: "Microsoft Excel",
  },
  {
    name: "Google Sheets",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg",
    alt: "Google Sheets",
  },
  {
    name: "Open-Meteo",
    logo: "https://open-meteo.com/favicon-32x32.png",
    alt: "Open-Meteo - Données météo",
  },
  {
    name: "EDF",
    logo: "https://logo.clearbit.com/edf.fr",
    alt: "EDF - Factures énergie",
  },
];

/* Double la liste pour boucle infinie */
const doubled = [...connectors, ...connectors];

const ConnectorsSection = () => (
  <section className="py-16 md:py-20 overflow-hidden">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Connecteurs & Sources
        </h2>
        <p className="text-muted-foreground text-lg">
          ar.ia se connecte à vos outils métier et enrichit vos données automatiquement.
        </p>
      </div>

      {/* Carrousel infini */}
      <div className="relative w-full">
        <div className="flex animate-scroll gap-12 w-max">
          {doubled.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="flex flex-col items-center justify-center min-w-[140px] group"
            >
              <div className="h-16 w-16 rounded-xl bg-card border shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                <img
                  src={c.logo}
                  alt={c.alt}
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xl font-bold text-primary">${c.name[0]}</span>`;
                  }}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {c.name}
              </span>
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
    `}</style>
  </section>
);

export default ConnectorsSection;
