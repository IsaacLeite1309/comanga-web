import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Action = {
  label: string;
  to: string;
  state?: unknown;
};

type LocationState = {
  title?: string;
  description?: string;
  actions?: Action[];
};

const PostCreateActions = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (!state?.title || !state.actions?.length) {
    return <Navigate to="/admin/editar-mangas" replace />;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-4">
      <section className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-7">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{state.title.endsWith("!") ? state.title : `${state.title}!`}</h1>
          {state.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.description}</p>
          ) : null}
        </div>

        <div className={`mt-7 grid gap-4 ${state.actions.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          {state.actions.map((action, index) => (
            <Link
              key={`${action.to}-${index}`}
              to={action.to}
              state={action.state}
              className={`inline-flex min-h-16 items-center justify-center gap-3 rounded-xl px-5 text-center text-base font-bold transition-colors ${
                index === 0
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border border-border bg-input text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {action.label}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PostCreateActions;
