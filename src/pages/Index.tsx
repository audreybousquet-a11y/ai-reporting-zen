import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ConnectorsSection from "@/components/ConnectorsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const ConstructionRibbon = () => (
  <div
    className="fixed z-[60] pointer-events-none"
    style={{ top: 0, left: "100px", width: "350px", height: "350px", overflow: "hidden" }}
  >
    <div
      style={{
        position: "absolute",
        top: "55px",
        left: "-60px",
        width: "450px",
        textAlign: "center",
        transform: "rotate(-40deg)",
        background: "repeating-linear-gradient(45deg, #F5A623, #F5A623 10px, #1a1a1a 10px, #1a1a1a 20px)",
        padding: "8px 0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
      }}
    >
      <span
        style={{
          color: "#fff",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        🔧 Logiciel en construction 🔧
      </span>
    </div>
  </div>
);

const Index = () => (
  <>
    <ConstructionRibbon />
    <Navbar />
    <main>
      <HeroSection />
      <FeaturesSection />
      <ConnectorsSection />
      <HowItWorksSection />
      <TrustSection />
      <ContactSection />
    </main>
    <Footer />
  </>
);

export default Index;
