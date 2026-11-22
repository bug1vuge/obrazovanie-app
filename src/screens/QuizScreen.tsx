import { useNavigate, useParams } from 'react-router-dom';
import { canEditCourse } from '@/entities/course/permissions';
import { QuizRunner } from '@/features/quiz/QuizRunner';
import { Button, EmptyState } from '@/shared/ui';
import { Screen } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import { isEnrolled } from '@/store/selectors';

export function QuizScreen() {
  const { courseId = '', quizId = '' } = useParams();
  const navigate = useNavigate();
  const db = useAppStore((state) => state.db);
  const submitQuiz = useAppStore((state) => state.submitQuiz);
  const user = useCurrentUser();
  const quiz = db.quizzes[quizId];
  const course = db.courses[courseId];
  const back = `/learn/${courseId}`;
  const allowed = Boolean(
    user && course && (isEnrolled(db, user.id, courseId) || canEditCourse(course, user)),
  );

  return (
    <Screen title={quiz?.title ?? 'Тест'} back={back}>
      <div className="px-4">
        {!quiz || quiz.courseId !== courseId ? (
          <EmptyState
            title="Тест не найден"
            action={<Button onClick={() => navigate(back)}>К урокам</Button>}
          />
        ) : !allowed ? (
          <EmptyState
            title="Тест доступен после записи"
            text="Запишитесь на курс, чтобы проходить тесты."
            action={<Button onClick={() => navigate(`/course/${courseId}`)}>К курсу</Button>}
          />
        ) : (
          <>
            <p className="muted mb-4 text-[13.5px]">
              {course?.title} · зачёт от 70% верных ответов, попыток сколько угодно.
            </p>
            <QuizRunner
              quiz={quiz}
              previous={user ? db.quizResults[`${user.id}:${quiz.id}`] : undefined}
              onSubmit={(answers) => submitQuiz(quiz.id, answers)}
            />
          </>
        )}
      </div>
    </Screen>
  );
}
