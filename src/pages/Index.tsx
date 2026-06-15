import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ConnectorsSection from "@/components/ConnectorsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const ConstructionBanner = () => (
  <div
    className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
    style={{ height: "32px" }}
  >
    <div
      style={{
        width: "200%",
        height: "100%",
        background:
          "repeating-linear-gradient(45deg, #F5A623, #F5A623 20px, #1a1a1a 20px, #1a1a1a 40px)",
        opacity: 0.9,
      }}
    />
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <span
        style={{
          color: "#F5A623",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        🔧 En construction — Lancement septembre 2026
      </span>
    </div>
  </div>
);

const Index = () => (
  <>
    <ConstructionBanner />
    <div style={{ paddingTop: "32px" }}>
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
    </div>
  </>
);

export default Index;
