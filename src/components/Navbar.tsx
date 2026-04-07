  import logo from "@/assets/logo-aria.png";
  import { Button } from "@/components/ui/button";

  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <img src={logo} alt="AR.IA" className="h-8" />
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
          <a href="#how" className="hover:text-primary transition-colors">Comment ça marche</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>
        <Button size="sm" asChild>
          <a href="#contact">Demander une démo</a>
        </Button>
      </div>
    </nav>
  );

  export default Navbar;
