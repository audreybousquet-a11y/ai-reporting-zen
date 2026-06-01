import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ConnectorsSection from "@/components/ConnectorsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => (
  <>
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
