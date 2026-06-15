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
    style={{ top: 0, left: 0, width: "200px", height: "200px", overflow: "hidden" }}
  >
    <div
      style={{
        position: "absolute",
        top: "38px",
        left: "-50px",
        width: "280px",
        textAlign: "center",
        transform: "rotate(-45deg)",
        background: "repeating-linear-gradient(90deg, #F5A623, #F5A623 10px, #e6951a 10px, #e6951a 20px)",
        padding: "6px 0",
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
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
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
