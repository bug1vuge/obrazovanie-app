import { BarChart3, BookOpen, LayoutGrid, Settings } from 'lucide-react';
import type { User } from '@/entities/types';
import type { TabsItem as TabItem } from '@/shared/ui';

export type ProfileTab = 'learning' | 'courses' | 'stats' | 'settings';

const STUDENT_TABS: readonly TabItem<ProfileTab>[] = [
  { id: 'learning', label: 'Обучение', icon: BookOpen },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

const TEACHER_TABS: readonly TabItem<ProfileTab>[] = [
  { id: 'courses', label: 'Курсы', icon: LayoutGrid },
  { id: 'stats', label: 'Статистика', icon: BarChart3 },
  { id: 'learning', label: 'Обучение', icon: BookOpen },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export function tabsFor(user: Pick<User, 'role'>) {
  return user.role === 'teacher' ? TEACHER_TABS : STUDENT_TABS;
}
