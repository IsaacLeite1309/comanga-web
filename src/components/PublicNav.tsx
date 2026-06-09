import { BookOpen, Search, CalendarCheck, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  emoji?: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

const navItemsList: NavItem[] = [
  { label: "Coleção", icon: BookOpen, href: "/colecao" },
  { label: "Pesquisar", icon: Search, href: "/pesquisa" },
  { label: "Checklists", icon: CalendarCheck, href: "/checklist" },
  { label: "Lista de Desejos", icon: Heart, href: "/desejos" },
];

function NavButton({ item, showLabel }: { item: NavItem; showLabel?: boolean }) {
  const content = (
    <button
      onClick={item.onClick}
      className={cn(
        "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-4 px-3 py-2 md:px-4 md:py-3 rounded-3xl transition-colors w-full font-bold",
        item.active
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : item.danger
            ? "text-red-500 hover:bg-red-500/10"
            : "text-white hover:bg-sidebar-accent"
      )}
    >
      <item.icon className="h-6 w-6 shrink-0" />
      {showLabel && <span className="text-base whitespace-nowrap">{item.label}</span>}
    </button>
  );

  if (item.href) {
    return <Link to={item.href} className="w-full">{content}</Link>;
  }

  return content;
}

export function PublicNav() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems = navItemsList.map(item => ({
    ...item,
    active: item.href ? location.pathname.startsWith(item.href) : false
  }));

  const userActionItem: NavItem = isAuthenticated
    ? { 
        label: "Meu Perfil", 
        icon: User, 
        active: location.pathname.startsWith("/perfil"), 
        href: `/perfil/${user?.username || ''}` 
      }
    : { 
        label: "Entrar", 
        icon: User, 
        active: location.pathname === "/entrar" || location.pathname === "/cadastrar", 
        href: "/entrar" 
      };

  return (
    <>
      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center gap-1 px-2 h-16 bg-sidebar border-t border-border">
        {navItems.map((item) => (
          <NavButton key={item.label} item={item} />
        ))}
        <NavButton item={userActionItem} />
      </nav>

      {/* Tablet sidebar */}
      <nav className="hidden md:flex lg:hidden fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-border flex-col justify-between py-6 z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-6">
            <BrandLogo className="h-8 w-8 [&>span]:text-lg" />
          </div>
          {navItems.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </div>
        <div className="flex flex-col items-center gap-2">
          <NavButton item={userActionItem} />
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-sidebar border-r border-border flex-col justify-between py-6 px-4 z-50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-8 px-3">
            <BrandLogo />
            <span className="text-2xl font-bold text-primary-foreground tracking-wide">Co<span className="text-primary">Mangá</span></span>
          </div>
          {navItems.map((item) => (
            <NavButton key={item.label} item={item} showLabel />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <NavButton item={userActionItem} showLabel />
        </div>
      </nav>
    </>
  );
}
