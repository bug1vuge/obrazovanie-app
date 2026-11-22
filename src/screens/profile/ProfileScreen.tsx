import { GraduationCap, LogIn, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { User } from '@/entities/types';
import { ROLE_LABELS } from '@/entities/user/lib';
import { formatDate } from '@/shared/lib/format';
import { Avatar, Badge, Button, Segmented, Tabs } from '@/shared/ui';
import { Screen } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import { ExamGoalPicker } from '@/widgets/student/ExamGoalPicker';
import { MyLearning } from '@/widgets/student/MyLearning';
import { TeacherCourses } from '@/widgets/teacher/TeacherCourses';
import { TeacherStats } from '@/widgets/teacher/TeacherStats';
import { SettingsPanel } from './SettingsPanel';
import { tabsFor, type ProfileTab } from './tabs';

const ROLE_OPTIONS = [
  { id: 'student', label: ROLE_LABELS.student },
  { id: 'teacher', label: ROLE_LABELS.teacher },
] as const;

function ProfileHeader({ user }: { user: User }) {
  const updateProfile = useAppStore((state) => state.updateProfile);
  return (
    <>
      <div className="card flex items-center gap-4 p-4">
        <Avatar name={user.displayName} size={58} tone={2} />
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-[18px] leading-tight">{user.displayName}</p>
          <p className="muted mt-0.5 truncate text-[13px]">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={user.role === 'teacher' ? 'primary' : 'neutral'}>
              {ROLE_LABELS[user.role]}
            </Badge>
            {user.isOwner && (
              <Badge tone="ok">
                <ShieldCheck size={12} aria-hidden /> Админ
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Segmented
          label="Роль в личном кабинете"
          value={user.role}
          options={ROLE_OPTIONS}
          onChange={(role) => updateProfile({ role })}
        />
        <p className="muted mt-1.5 px-1 text-[11.5px]">
          С нами с {formatDate(user.since)}. Роль можно менять в любой момент.
        </p>
      </div>
    </>
  );
}

export function ProfileScreen() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  if (!user) {
    return (
      <Screen title="Профиль" largeTitle withTabBar>
        <div className="px-4 pt-4">
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <span className="soft-bg flex h-16 w-16 items-center justify-center rounded-3xl">
              <LogIn size={28} className="muted" aria-hidden />
            </span>
            <p className="font-display mt-4 text-[19px]">Личный кабинет</p>
            <p className="muted mt-2 text-[14px] leading-relaxed">
              Войдите, чтобы выбрать экзамен и курс, следить за прогрессом и получать сертификаты.
              Преподаватели видят здесь свои курсы и доход.
            </p>
            <Button size="lg" className="mt-5 w-full" onClick={() => navigate('/login')}>
              Войти или создать аккаунт
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const tabs = tabsFor(user);
  const requested = params.get('tab') as ProfileTab | null;
  const tab = tabs.some((item) => item.id === requested) ? (requested as ProfileTab) : tabs[0]!.id;

  return (
    <Screen title="Профиль" largeTitle withTabBar>
      <div className="px-4">
        <ProfileHeader user={user} />
        <div className="-mx-4 mt-5 px-4">
          <Tabs
            label="Разделы кабинета"
            tabs={tabs}
            value={tab}
            onChange={(next) => setParams({ tab: next }, { replace: true })}
          />
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-4">
          {tab === 'learning' && (
            <div className="flex flex-col gap-6">
              <ExamGoalPicker key={user.id} user={user} />
              <MyLearning user={user} />
            </div>
          )}
          {tab === 'courses' && <TeacherCourses user={user} />}
          {tab === 'stats' && <TeacherStats user={user} />}
          {tab === 'settings' && <SettingsPanel user={user} />}
        </div>
        {user.role === 'student' && !user.isOwner && tab === 'learning' && (
          <p className="muted mt-6 flex items-center gap-1.5 text-[12px]">
            <GraduationCap size={14} aria-hidden /> Хотите преподавать? Переключите роль на
            «Преподаватель».
          </p>
        )}
      </div>
    </Screen>
  );
}
