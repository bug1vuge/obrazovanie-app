import { createContext, useContext } from 'react';

/**
 * Element that hosts sheets and toasts inside the (possibly framed) screen so
 * that overlays never leave the phone frame. Falls back to <body>.
 */
export const OverlayRootContext = createContext<HTMLElement | null>(null);

export function useOverlayRoot(): HTMLElement {
  return useContext(OverlayRootContext) ?? document.body;
}
