import logo from "@/assets/logo-aria.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
    <div className="container mx-auto flex items-center justify-between h-16 px-4">
      <Link to="/">
        <img src={logo} alt="AR.IA" className="h-8" />
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <a href="/#features" className="hover:text-primary transition-colors">Fonctionnalites</a>
        <a href="/#how" className="hover:text-primary transition-colors">Comment ca marche</a>
        <Link to="/tarifs" className="hover:text-primary transition-colors">Tarifs</Link>
        <a href="/#contact" className="hover:text-primary transition-colors">Contact</a>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" asChild>
          <a href="https://app.ar-ia.fr" target="_blank" rel="noopener noreferrer">Acceder a l appli</a>
        </Button>
        <Button size="sm" asChild>
          <a href="/#contact">Nous contacter</a>
        </Button>
      </div>
    </div>
  </nav>
);

export default Navbar;
