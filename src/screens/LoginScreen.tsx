import { GraduationCap, ShieldCheck, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEMO_OWNER_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from '@/data/seed';
import { Button, Field, Notice } from '@/shared/ui';
import { Screen } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';

const DEMO_ACCOUNTS = [
  {
    id: DEMO_STUDENT_ID,
    title: 'Ученик',
    text: 'Алиса Смирнова · готовится к экзаменам',
    icon: UserRound,
  },
  {
    id: DEMO_TEACHER_ID,
    title: 'Преподаватель',
    text: 'Ирина Соколова · курсы и доход',
    icon: GraduationCap,
  },
  {
    id: DEMO_OWNER_ID,
    title: 'Администратор',
    text: 'Модерация и статистика платформы',
    icon: ShieldCheck,
  },
] as const;

/** Only allow in-app return paths. */
const safeReturn = (value: string | null) => (value && value.startsWith('/') ? value : '/profile');

export function LoginScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signIn = useAppStore((state) => state.signIn);
  const signInWithEmail = useAppStore((state) => state.signInWithEmail);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const from = params.get('from');

  const done = (fallback: string) =>
    navigate(from ? safeReturn(from) : fallback, { replace: true });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    try {
      signInWithEmail({ name, email });
      done('/profile');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen title="Вход" back="/">
      <div className="px-5">
        <div className="flex flex-col items-center pb-6 pt-2 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[20px] text-white"
            style={{
              background:
                'linear-gradient(140deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
            }}
          >
            <GraduationCap size={32} aria-hidden />
          </span>
          <h2 className="font-display mt-4 text-[24px]">Вход в Study Pro</h2>
          <p className="muted mt-1.5 text-[14px]">Демо-доступ — войдите в один клик</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {DEMO_ACCOUNTS.map(({ id, title, text, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                signIn(id);
                done(id === DEMO_OWNER_ID ? '/admin' : '/profile');
              }}
              className="card pressable flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="soft-bg flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <Icon size={20} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[15.5px] font-semibold">{title}</span>
                <span className="muted block truncate text-[12.5px]">{text}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="muted my-6 flex items-center gap-3 text-[11.5px] uppercase tracking-wider">
          <span className="hairline-t flex-1" />
          или по e-mail
          <span className="hairline-t flex-1" />
        </div>

        <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
          <Field label="Имя">
            <input
              className="inp"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Как к вам обращаться"
              autoComplete="name"
            />
          </Field>
          <Field label="E-mail">
            <input
              className="inp"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" size="lg">
            Войти или создать аккаунт
          </Button>
          <Button variant="ghost" onClick={() => navigate('/', { replace: true })}>
            Продолжить без входа
          </Button>
          <p className="muted text-center text-[11.5px]">
            Это демо-версия: данные хранятся только на этом устройстве.
          </p>
        </form>
      </div>
    </Screen>
  );
}
