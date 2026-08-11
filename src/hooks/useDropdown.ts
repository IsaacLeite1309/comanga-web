import { useEffect, useId, useState } from "react";

const DROPDOWN_OPEN_EVENT = "comanga:dropdown-open";

export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownId = useId();

  function openDropdown() {
    window.dispatchEvent(new CustomEvent(DROPDOWN_OPEN_EVENT, { detail: dropdownId }));
    setIsOpen(true);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function toggleDropdown() {
    if (isOpen) {
      closeDropdown();
      return;
    }

    openDropdown();
  }

  useEffect(() => {
    function handleOpen(event: Event) {
      const customEvent = event as CustomEvent<string>;

      if (customEvent.detail !== dropdownId) {
        closeDropdown();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      const clickedDropdown = target instanceof Element
        ? target.closest("[data-comanga-dropdown-root]")
        : null;

      if (clickedDropdown?.getAttribute("data-comanga-dropdown-id") === dropdownId) {
        return;
      }

      closeDropdown();
    }

    window.addEventListener(DROPDOWN_OPEN_EVENT, handleOpen);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener(DROPDOWN_OPEN_EVENT, handleOpen);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [dropdownId]);

  return {
    isOpen,
    setIsOpen,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    rootProps: {
      "data-comanga-dropdown-root": "",
      "data-comanga-dropdown-id": dropdownId,
    },
  };
}
