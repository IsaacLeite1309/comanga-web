import { Link, useLocation } from "react-router-dom";

export function GuestLibraryNotice({ feature }: { feature: "coleção" | "lista de desejos" }) {
  const location = useLocation();
  const buttonClassName = "mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-bold text-white transition-colors hover:bg-primary/90";

  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-xs space-y-5 rounded-2xl border border-sidebar-foreground/30 bg-sidebar px-4 py-6 text-center">
        <div>
          <p role="status" className="text-base text-white">
            Faça login com sua conta CoMangá para gerenciar sua {feature}.
          </p>
          <Link to="/entrar" state={{ from: location }} className={buttonClassName}>
            Entrar
          </Link>
        </div>
        <div>
          <p className="text-base text-white">
            Ainda não tem uma conta? O cadastro é rápido e gratuito!
          </p>
          <Link to="/cadastrar" state={{ from: location }} className={buttonClassName}>
            Cadastrar
          </Link>
        </div>
      </div>
    </div>
  );
}
