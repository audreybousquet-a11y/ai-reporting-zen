  import Navbar from "@/components/Navbar";
  import HeroSection from "@/components/HeroSection";
  import FeaturesSection from "@/components/FeaturesSection";
  import HowItWorksSection from "@/components/HowItWorksSection";
  import ContactSection from "@/components/ContactSection";
  import Footer from "@/components/Footer";

  const Index = () => (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );

  export default Index;
