import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '@/shared/ui';
import { Screen } from '@/shared/ui/native';

export function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <Screen title="Не найдено" back="/">
      <div className="px-4 pt-6">
        <EmptyState
          icon={Compass}
          title="Экран не найден"
          text="Возможно, ссылка устарела. Начните с каталога курсов."
          action={<Button onClick={() => navigate('/', { replace: true })}>В каталог</Button>}
        />
      </div>
    </Screen>
  );
}
