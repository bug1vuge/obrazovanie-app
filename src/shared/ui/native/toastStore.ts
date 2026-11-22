import { create } from 'zustand';

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'error';
}

interface ToastState {
  toasts: Toast[];
  show: (text: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
}

let counter = 0;
export const TOAST_DURATION_MS = 2800;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (text, tone = 'info') => {
    const id = ++counter;
    set({ toasts: [...get().toasts.slice(-2), { id, text, tone }] });
    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

/** Shortcut for components: `const toast = useToast(); toast('Сохранено')`. */
export const useToast = () => useToasts((state) => state.show);
