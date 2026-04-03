import logo from "@/assets/logo-aria.png";

const Footer = () => (
  <footer className="border-t py-10">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <img src={logo} alt="AR.IA" className="h-6 opacity-70" />
      <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AR.IA by abcarré. Tous droits réservés.</p>
    </div>
  </footer>
);

export default Footer;
