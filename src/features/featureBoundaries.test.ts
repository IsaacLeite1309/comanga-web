import { describe, expect, it } from "vitest";
import { ActivatePage, AuthPage, ResendActivationPage } from "@/features/auth";
import { ChecklistPage, CollectionPage } from "@/features/collection";
import {
  AdminOptionsPage,
  EditMangasPage,
  EditWorkPage,
  NewMangaPage,
} from "@/features/admin-catalog";
import { AdminUsersPage } from "@/features/admin-users";
import { ProfilePage } from "@/features/profile";
import { PublicCatalogPage } from "@/features/public-catalog";
import { WishlistPage } from "@/features/wishlist";

describe("limites funcionais do frontend", () => {
  it("expõe as páginas públicas e autenticadas pelos módulos correspondentes", () => {
    [
      AuthPage,
      ActivatePage,
      ResendActivationPage,
      ProfilePage,
      PublicCatalogPage,
      CollectionPage,
      ChecklistPage,
      WishlistPage,
    ].forEach((page) => expect(page).toBeTypeOf("function"));
  });

  it("expõe as páginas administrativas pelos módulos administrativos", () => {
    [AdminOptionsPage, EditMangasPage, EditWorkPage, NewMangaPage, AdminUsersPage].forEach((page) =>
      expect(page).toBeTypeOf("function"),
    );
  });
});
