import { Compass, UserRound } from 'lucide-react';
import type { TabItem } from '@/shared/ui/native';

/** Bottom navigation keeps only «Каталог» and «Профиль», as on the website. */
export const TABS: readonly TabItem[] = [
  { to: '/', label: 'Каталог', icon: Compass, end: true },
  { to: '/profile', label: 'Профиль', icon: UserRound },
];
