import { Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { certificateNumber } from '@/entities/certificate/lib';
import { CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from '@/features/certificate/certificateSize';
import { CertificateView } from '@/features/certificate/CertificateView';
import { downloadElementAsPdf } from '@/features/certificate/exportPdf';
import { Button, EmptyState, ScaleToFit } from '@/shared/ui';
import { Screen, useToast } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import { getCourseOutline, getLessonProgressIndex } from '@/store/selectors';

export function CertificateScreen() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const db = useAppStore((state) => state.db);
  const issueCertificate = useAppStore((state) => state.issueCertificate);
  const user = useCurrentUser();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const course = db.courses[courseId];
  const outline = useMemo(() => getCourseOutline(db, courseId), [db, courseId]);
  const progress = useMemo(() => getLessonProgressIndex(db, user?.id), [db, user?.id]);
  const done = outline.lessons.filter((lesson) => progress[lesson.id]?.completed).length;
  const finished = outline.lessons.length > 0 && done >= outline.lessons.length;
  const number = user && course ? certificateNumber(user.id, course.id) : '';
  const certificate = number ? db.certificates[number] : undefined;

  useEffect(() => {
    if (finished && user && course && !certificate) issueCertificate(course.id);
  }, [finished, user, course, certificate, issueCertificate]);

  const download = async () => {
    if (!ref.current || !course) return;
    setBusy(true);
    try {
      await downloadElementAsPdf(ref.current, `studypro-certificate-${course.id}.pdf`);
      toast('PDF сохранён');
    } catch {
      toast('Не удалось собрать PDF — попробуйте ещё раз', 'error');
    } finally {
      setBusy(false);
    }
  };

  const ready = Boolean(course && user && finished);

  return (
    <Screen
      title="Сертификат"
      back="/profile"
      footer={
        ready ? (
          <div className="flex gap-2">
            <Button variant="soft" className="flex-1" onClick={() => window.print()}>
              <Printer size={17} aria-hidden /> Печать
            </Button>
            <Button className="flex-1" onClick={download} disabled={busy}>
              <Download size={17} aria-hidden /> {busy ? 'Готовим…' : 'Скачать PDF'}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="px-4">
        {!course ? (
          <EmptyState title="Курс не найден" />
        ) : !user ? (
          <EmptyState
            title="Войдите, чтобы получить сертификат"
            action={<Button onClick={() => navigate('/login')}>Войти</Button>}
          />
        ) : !finished ? (
          <EmptyState
            title="Курс ещё не завершён"
            text={`Пройдено ${done} из ${outline.lessons.length} уроков. Дойдите до конца — и сертификат откроется.`}
            action={
              <Button onClick={() => navigate(`/course/${course.id}`)}>Вернуться к курсу</Button>
            }
          />
        ) : (
          <>
            <p className="muted mb-4 text-[13.5px]">
              Скачайте PDF или распечатайте — файл совпадает с тем, что на экране.
            </p>
            <div className="card overflow-hidden p-2 shadow-lg">
              <ScaleToFit width={CERTIFICATE_WIDTH} height={CERTIFICATE_HEIGHT}>
                <CertificateView
                  ref={ref}
                  number={number}
                  studentName={user.displayName}
                  courseTitle={course.title}
                  teacherName={course.teacherName}
                  issuedAt={certificate?.issuedAt ?? new Date().toISOString()}
                />
              </ScaleToFit>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
