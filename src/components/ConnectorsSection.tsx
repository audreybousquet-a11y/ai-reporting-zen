const connectors = [
  { name: "Deytime", logo: "/logos/DeyTime.png" },
  { name: "Extrabat", logo: "/logos/Extrabat.png" },
  { name: "Pennylane", logo: "/logos/pennylane.png" },
  { name: "Excel", logo: "/logos/Excel2.png" },
  { name: "Google Sheets", logo: "/logos/google_sheets.svg" },
  { name: "Gmail", logo: "/logos/fmail.png" },
  { name: "Open-Meteo", logo: "/logos/Open_Meteo.png" },
  { name: "EDF", logo: "/logos/edf.svg" },
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
          ar.ia se connecte à vos outils métier et enrichit vos données automatiquement.
        </p>
      </div>
      <div className="relative w-full">
        <div className="flex animate-scroll gap-12 w-max">
          {doubled.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="flex flex-col items-center justify-center min-w-[140px] group"
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
