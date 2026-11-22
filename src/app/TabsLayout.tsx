import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from '@/shared/ui/native';
import { TABS } from './tabs';

export function TabsLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col">
      <div key={pathname} className="screen-enter-fade relative min-h-0 flex-1">
        <Outlet />
      </div>
      <TabBar items={TABS} />
    </div>
  );
}
