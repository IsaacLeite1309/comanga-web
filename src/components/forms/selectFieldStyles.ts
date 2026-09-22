export type SelectTone = "default" | "sidebar" | "panel";

export interface SelectFieldStyles {
  brightTone: boolean;
  controlTextSize: string;
  fieldSurface: string;
  menuSurface: string;
  secondaryText: string;
}

export function getSelectFieldStyles(
  tone: SelectTone,
  textSize: "sm" | "base",
): SelectFieldStyles {
  const sidebarTone = tone === "sidebar";
  const brightTone = sidebarTone || tone === "panel";
  let fieldSurface = "border-border bg-input";

  if (sidebarTone) fieldSurface = "border-sidebar-foreground/35 bg-sidebar";
  if (tone === "panel") fieldSurface = "border-sidebar-foreground/35 bg-background";

  return {
    brightTone,
    controlTextSize: textSize === "sm" ? "text-sm" : "text-base",
    fieldSurface,
    menuSurface: sidebarTone ? "bg-sidebar" : "bg-background",
    secondaryText: brightTone ? "text-foreground" : "text-muted-foreground",
  };
}

export function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
