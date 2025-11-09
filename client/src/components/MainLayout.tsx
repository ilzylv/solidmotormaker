import { Link, useLocation } from "wouter";
import { Rocket, Calculator, Cog, Wind } from "lucide-react";
import { APP_TITLE } from "@/const";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: "/", label: "Predição de Requisitos", icon: Calculator },
  { path: "/grain-design", label: "Dimensionamento de Grãos", icon: Rocket },
  { path: "/structural", label: "Dimensionamento Estrutural", icon: Cog },
  { path: "/aerodynamics", label: "Simulações Aerodinâmicas", icon: Wind },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-8 h-8" />
              <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
            </div>
            <p className="text-sm opacity-90 hidden sm:block">
              Sistema de Design de Motores Sólidos
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container">
          <div className="flex overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-4 mt-8">
        <div className="container">
          <p className="text-sm text-center">
            © 2025 Solid Motor Maker - Sistema de Design de Motores Sólidos para Foguetes
          </p>
        </div>
      </footer>
    </div>
  );
}
