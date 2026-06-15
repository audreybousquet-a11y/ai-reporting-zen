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
    style={{ top: 0, left: "120px", width: "250px", height: "250px", overflow: "hidden" }}
  >
    <div
      style={{
        position: "absolute",
        top: "48px",
        left: "-30px",
        width: "320px",
        textAlign: "center",
        transform: "rotate(-40deg)",
        background: "repeating-linear-gradient(90deg, #F5A623, #F5A623 12px, #1a1a1a 12px, #1a1a1a 24px)",
        padding: "7px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <span
        style={{
          color: "#fff",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        🔧 En construction
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
