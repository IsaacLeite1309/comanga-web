import type { MouseEvent as ReactMouseEvent } from "react";
import { Link, useNavigate, type LinkProps } from "react-router-dom";

type BackLinkProps = LinkProps & { preferHistory?: boolean };

function hasPreviousRouterEntry() {
  const state = window.history.state as { idx?: unknown } | null;
  return typeof state?.idx === "number" && state.idx > 0;
}

export function BackLink({ onClick, preferHistory = false, ...props }: BackLinkProps) {
  const navigate = useNavigate();

  function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!preferHistory || !hasPreviousRouterEntry()) return;
    event.preventDefault();
    navigate(-1);
  }

  return <Link {...props} onClick={handleClick} />;
}
