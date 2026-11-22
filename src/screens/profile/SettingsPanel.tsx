import { Award, LogOut, Moon, Pencil, RotateCcw, ShieldCheck, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceStore, type Platform } from '@/device/deviceStore';
import type { User } from '@/entities/types';
import { formatDate } from '@/shared/lib/format';
import { Button, Field } from '@/shared/ui';
import { ConfirmSheet, ListGroup, ListRow, PickerField, Sheet, useToast } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { values } from '@/store/table';
import { useThemeStore } from '@/store/themeStore';

function EditProfileSheet({
  user,
  open,
  onClose,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
}) {
  const updateProfile = useAppStore((state) => state.updateProfile);
  const toast = useToast();
  const [name, setName] = useState(user.displayName);
  const [headline, setHeadline] = useState(user.headline);
  const [bio, setBio] = useState(user.bio);

  const save = () => {
    updateProfile({ displayName: name, headline, bio });
    toast('Профиль сохранён');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Профиль"
      footer={
        <Button size="lg" className="w-full" onClick={save}>
          Сохранить
        </Button>
      }
    >
      <div className="flex flex-col gap-3 pb-1">
        <Field label="Имя">
          <input value={name} onChange={(event) => setName(event.target.value)} className="inp" />
        </Field>
        <Field label="Коротко о себе" hint="Видно на странице курса">
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="inp"
            placeholder={
              user.role === 'teacher' ? 'Учитель математики, 12 лет практики' : 'Ученик 11 класса'
            }
          />
        </Field>
        {user.role === 'teacher' && (
          <Field label="О преподавателе">
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="inp"
            />
          </Field>
        )}
      </div>
    </Sheet>
  );
}

const PLATFORM_OPTIONS = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
] as const;

export function SettingsPanel({ user }: { user: User }) {
  const navigate = useNavigate();
  const signOut = useAppStore((state) => state.signOut);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const certificates = useAppStore((state) => state.db.certificates);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const platform = useDeviceStore((state) => state.platform);
  const setPlatform = useDeviceStore((state) => state.setPlatform);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<'logout' | 'reset' | null>(null);

  const own = useMemo(
    () => values(certificates).filter((item) => item.userId === user.id),
    [certificates, user.id],
  );

  return (
    <div className="flex flex-col gap-5">
      <ListGroup title="Аккаунт" className="!px-0">
        <ListRow
          icon={Pencil}
          iconTone="bg-[#5b47d6]"
          label="Редактировать профиль"
          detail={user.headline || user.email}
          onClick={() => setEditOpen(true)}
        />
      </ListGroup>

      <ListGroup
        className="!px-0"
        title="Сертификаты"
        footer={own.length === 0 ? 'Завершите курс — и сертификат появится здесь.' : undefined}
      >
        {own.length === 0 ? (
          <ListRow icon={Award} iconTone="bg-[#f0663a]" label="Пока нет сертификатов" />
        ) : (
          own.map((certificate) => (
            <ListRow
              key={certificate.id}
              icon={Award}
              iconTone="bg-[#f0663a]"
              label={certificate.courseTitle}
              detail={`${certificate.id} · ${formatDate(certificate.issuedAt)}`}
              onClick={() => navigate(`/certificate/${certificate.courseId}`)}
            />
          ))
        )}
      </ListGroup>

      <ListGroup title="Оформление" className="!px-0">
        <ListRow
          icon={Moon}
          iconTone="bg-[#1f2937]"
          label="Тёмная тема"
          chevron={false}
          trailing={
            <input
              type="checkbox"
              role="switch"
              className="switch"
              aria-label="Тёмная тема"
              checked={theme === 'dark'}
              onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
            />
          }
        />
        <ListRow
          icon={Smartphone}
          iconTone="bg-[#0f766e]"
          label="Вид приложения"
          chevron={false}
          trailing={
            <PickerField<Platform>
              title="Вид приложения"
              aria-label="Вид приложения"
              value={platform}
              options={PLATFORM_OPTIONS}
              onChange={setPlatform}
              className="!w-auto !border-0 !bg-transparent !py-1 !pr-0 text-[14px]"
            />
          }
        />
      </ListGroup>

      <ListGroup className="!px-0">
        {user.isOwner && (
          <ListRow
            icon={ShieldCheck}
            iconTone="bg-emerald-600"
            label="Админ-панель"
            onClick={() => navigate('/admin')}
          />
        )}
        <ListRow
          icon={RotateCcw}
          iconTone="bg-amber-500"
          label="Сбросить демо-данные"
          onClick={() => setConfirm('reset')}
        />
        <ListRow
          icon={LogOut}
          label="Выйти из аккаунта"
          destructive
          onClick={() => setConfirm('logout')}
        />
      </ListGroup>

      <EditProfileSheet
        key={String(editOpen)}
        user={user}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <ConfirmSheet
        open={confirm === 'logout'}
        title="Выйти из аккаунта?"
        message="Прогресс сохранится — войдите снова, чтобы продолжить обучение."
        confirmLabel="Выйти"
        destructive
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          signOut();
          navigate('/', { replace: true });
        }}
      />
      <ConfirmSheet
        open={confirm === 'reset'}
        title="Сбросить демо-данные?"
        message="Записи на курсы, прогресс и изменения на этом устройстве будут удалены, каталог вернётся в исходное состояние."
        confirmLabel="Сбросить"
        destructive
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          resetDemo();
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}
