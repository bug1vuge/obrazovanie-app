import { create } from 'zustand';

export type Platform = 'ios' | 'android';
const PLATFORM_KEY = 'studypro-app-platform';

function detectPlatform(): Platform {
  try {
    const saved = localStorage.getItem(PLATFORM_KEY);
    if (saved === 'ios' || saved === 'android') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
    ? 'android'
    : 'ios';
}

interface DeviceState {
  /** Look & feel of the native shell: navigation bars, tab bar, transitions. */
  platform: Platform;
  setPlatform: (platform: Platform) => void;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  platform: detectPlatform(),
  setPlatform: (platform) => {
    try {
      localStorage.setItem(PLATFORM_KEY, platform);
    } catch {
      /* ignore */
    }
    set({ platform });
  },
}));

export const usePlatform = () => useDeviceStore((state) => state.platform);
