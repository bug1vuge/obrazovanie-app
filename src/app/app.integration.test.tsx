import { act, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DRAFT_COURSE_ID } from '@/data/catalog';
import { DEMO_OWNER_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from '@/data/seed';
import { DEMO_PAYMENT_DELAY_MS } from '@/features/checkout/CheckoutSheet';
import { useAppStore } from '@/store/appStore';
import { values } from '@/store/table';
import { renderApp } from '@/test/utils';
import { isOnboarded } from './onboarding';

const courseLinks = () =>
  screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/course/'));

describe('first launch', () => {
  it('shows onboarding, then the sign-in screen', async () => {
    localStorage.clear();
    const { user, router } = renderApp('/', { onboarded: false });
    expect(router.state.location.pathname).toBe('/welcome');
    expect(screen.getByRole('heading', { name: 'Подготовься к ОГЭ и ЕГЭ' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Далее' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));
    expect(isOnboarded()).toBe(true);
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByRole('heading', { name: 'Вход в Study Pro' })).toBeInTheDocument();
  });

  it('lets the visitor continue without signing in', async () => {
    const { user, router } = renderApp('/login');
    await user.click(screen.getByRole('button', { name: 'Продолжить без входа' }));
    expect(router.state.location.pathname).toBe('/');
  });
});

describe('catalog', () => {
  it('lists all published courses with unique covers and only two tabs', () => {
    const { container } = renderApp('/');
    expect(courseLinks()).toHaveLength(36);
    const images = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(new Set(images).size).toBe(36);
    const tabs = screen.getByRole('navigation', { name: 'Нижняя навигация' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Каталог', 'Профиль']);
  });

  it('filters by exam, subject and search; sort has no «Популярные» and there is no price filter', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('radio', { name: 'ЕГЭ' }));
    expect(courseLinks().length).toBeLessThan(36);
    await user.click(screen.getByRole('button', { name: 'География' }));
    expect(courseLinks().map((link) => link.textContent)).toEqual([
      expect.stringContaining('География: ЕГЭ с экспертом'),
      expect.stringContaining('География: онлайн-занятия со студентом вуза'),
    ]);

    await user.click(screen.getByRole('button', { name: 'Сортировка' }));
    const sheet = screen.getByRole('dialog', { name: 'Сортировка' });
    expect(
      within(sheet)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Новые', 'По рейтингу']);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/Любая цена|Платные/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    await user.type(screen.getByRole('searchbox', { name: 'Поиск курсов' }), 'несуществующий');
    expect(screen.getByText('Ничего не нашлось')).toBeInTheDocument();
  });
});

describe('auth', () => {
  it('signs in with a demo account and returns to the requested screen', async () => {
    const { user, router } = renderApp('/login?from=%2Fcourse%2Fk-math');
    await user.click(screen.getByRole('button', { name: /Ученик/ }));
    expect(useAppStore.getState().session.userId).toBe(DEMO_STUDENT_ID);
    expect(router.state.location.pathname).toBe('/course/k-math');
  });

  it('validates the e-mail form', async () => {
    const { user } = renderApp('/login');
    await user.type(screen.getByLabelText('E-mail'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Войти или создать аккаунт' }));
    expect(screen.getByRole('alert')).toHaveTextContent('корректный e-mail');
  });
});

describe('student cabinet', () => {
  it('asks to choose ОГЭ/ЕГЭ and a course', async () => {
    const { user } = renderApp('/profile', { userId: DEMO_STUDENT_ID });
    expect(
      screen.getByRole('heading', { name: 'К какому экзамену готовитесь?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /ОГЭ/ }));
    const list = screen.getByRole('radiogroup', { name: 'Курс' });
    await user.click(within(list).getByRole('radio', { name: /Физика: ОГЭ с экспертом/ }));
    expect(useAppStore.getState().db.users[DEMO_STUDENT_ID]?.goal).toEqual({
      exam: 'oge',
      courseId: 'sp-phys-oge-expert',
    });
    expect(screen.getByRole('region', { name: 'Цель подготовки' })).toHaveTextContent(
      'Готовлюсь к ОГЭ',
    );
    expect(screen.getByRole('heading', { name: 'Моё обучение' })).toBeInTheDocument();
  });

  it('opens certificates from settings', async () => {
    const { user, router } = renderApp('/profile?tab=settings', { userId: DEMO_STUDENT_ID });
    await user.click(screen.getByRole('button', { name: /Информатика: онлайн-занятия/ }));
    expect(router.state.location.pathname).toBe('/certificate/sp-inf-students');
    expect(await screen.findByRole('button', { name: /Скачать PDF/ })).toBeInTheDocument();
  });
});

describe('teacher cabinet', () => {
  it('shows income statistics', async () => {
    const { user } = renderApp('/profile', { userId: DEMO_TEACHER_ID });
    await user.click(screen.getByRole('tab', { name: 'Статистика' }));
    expect(screen.getByText('Доход с продаж')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Доход по месяцам' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Доход по курсам' })).toHaveTextContent(
      'Русский язык: ЕГЭ',
    );
  });

  it('creates a course, builds the programme and sends it to moderation', async () => {
    const { user } = renderApp('/profile?tab=courses', { userId: DEMO_TEACHER_ID });
    await user.click(screen.getByRole('button', { name: 'Создать курс' }));
    await user.type(screen.getByLabelText('Название курса'), 'Тригонометрия');
    await user.click(screen.getByRole('button', { name: 'Создать и открыть' }));

    expect(await screen.findByRole('heading', { name: 'Программа' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Добавить модуль' }));
    await user.click(screen.getByRole('button', { name: /Урок/ }));
    const sheet = screen.getByRole('dialog', { name: 'Новый урок' });
    await user.type(within(sheet).getByLabelText('Название'), 'Единичная окружность');

    // The lesson type picker opens a nested sheet; Escape closes only the picker.
    await user.click(within(sheet).getByRole('button', { name: 'Тип' }));
    expect(screen.getByRole('dialog', { name: 'Тип урока' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Тип урока' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Новый урок' })).toBeInTheDocument();

    await user.click(within(sheet).getByRole('button', { name: /Сохранить/ }));
    expect(screen.getByRole('button', { name: 'Единичная окружность' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Отправить на модерацию/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Курс отправлен на модерацию');
    const created = values(useAppStore.getState().db.courses).find(
      (course) => course.title === 'Тригонометрия',
    );
    expect(created?.status).toBe('pending');
  });
});

describe('course, lessons and tests', () => {
  it('lets the author edit the course instead of buying it', async () => {
    const { user, router } = renderApp('/course/k-rus', { userId: DEMO_TEACHER_ID });
    expect(screen.queryByRole('button', { name: 'Купить курс' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Редактировать/ }));
    expect(router.state.location.pathname).toBe('/studio/k-rus');
  });

  it('enrolls into a free course', async () => {
    const { user } = renderApp('/course/sp-geo-students', { userId: DEMO_STUDENT_ID });
    await user.click(screen.getByRole('button', { name: 'Записаться' }));
    expect(screen.getByRole('status')).toHaveTextContent('Вы записаны на курс');
    expect(screen.getByRole('button', { name: /Продолжить обучение/ })).toBeInTheDocument();
  });

  it('sends a guest to the sign-in screen before buying', async () => {
    const { user, router } = renderApp('/course/sp-geo-ege-expert');
    await user.click(screen.getByRole('button', { name: 'Купить курс' }));
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?from=%2Fcourse%2Fsp-geo-ege-expert');
  });

  it('buys a course with a promo code in the checkout sheet', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { user } = renderApp('/course/sp-geo-ege-expert', { userId: DEMO_STUDENT_ID });
      await user.click(screen.getByRole('button', { name: 'Купить курс' }));
      const sheet = screen.getByRole('dialog', { name: 'Оплата курса' });
      await user.type(within(sheet).getByRole('textbox', { name: 'Промокод' }), 'ege2026');
      await user.click(within(sheet).getByRole('button', { name: 'ОК' }));
      expect(within(sheet).getByText(/Промокод EGE2026/)).toBeInTheDocument();
      await user.click(within(sheet).getByRole('button', { name: /Оплатить/ }));
      await act(async () => {
        vi.advanceTimersByTime(DEMO_PAYMENT_DELAY_MS);
      });
      expect(screen.getByRole('status')).toHaveTextContent('Оплата прошла');
      expect(
        useAppStore.getState().db.enrollments[`${DEMO_STUDENT_ID}:sp-geo-ege-expert`],
      ).toMatchObject({
        amount: 1992,
        promoCode: 'EGE2026',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('marks a lesson as completed and passes the module test', async () => {
    const { user, router } = renderApp('/learn/k-math/k-math-l4', { userId: DEMO_STUDENT_ID });
    expect(
      screen.getByRole('heading', { name: 'Графики функций и производная' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Отметить пройденным/ }));
    expect(screen.getByRole('button', { name: /Пройдено/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Содержание' }));
    const contents = screen.getByRole('dialog', { name: 'Содержание' });
    expect(within(contents).getByText('4 из 6 уроков · 67%')).toBeInTheDocument();
    await user.click(within(contents).getAllByRole('button', { name: /Тест модуля/ })[1]!);
    expect(router.state.location.pathname).toBe('/learn/k-math/quiz/k-math-q2');

    const quiz = useAppStore.getState().db.quizzes['k-math-q2']!;
    for (const [index, question] of quiz.questions.entries()) {
      const group = screen.getByRole('group', { name: `Вопрос ${index + 1}` });
      await user.click(
        within(group).getByRole('button', {
          name: new RegExp(question.options[question.correct]!),
        }),
      );
    }
    await user.click(screen.getByRole('button', { name: 'Проверить ответы' }));
    expect(screen.getByText('Тест сдан')).toBeInTheDocument();
  });

  it('locks paid lessons for guests and goes back with the back button', async () => {
    const { user, router } = renderApp('/course/k-math');
    await user.click(screen.getByRole('link', { name: /Как устроен профильный экзамен/ }));
    expect(router.state.location.pathname).toBe('/learn/k-math/k-math-l1');
    await user.click(screen.getByRole('button', { name: 'Следующий урок' }));
    expect(screen.getByRole('heading', { name: 'Урок доступен после записи' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Назад' }));
    expect(router.state.location.pathname).toBe('/course/k-math');
  });
});

describe('admin', () => {
  it('publishes a course from the moderation queue', async () => {
    const { user } = renderApp('/admin', { userId: DEMO_OWNER_ID });
    await user.click(await screen.findByRole('button', { name: /^Опубликовать$/ }));
    expect(useAppStore.getState().db.courses[DRAFT_COURSE_ID]?.status).toBe('published');
    expect(screen.getByText('Очередь пуста')).toBeInTheDocument();
  });

  it('is closed for other users', async () => {
    renderApp('/admin', { userId: DEMO_STUDENT_ID });
    expect(
      await screen.findByText('Доступ есть только у администратора платформы.'),
    ).toBeInTheDocument();
  });
});

describe('settings', () => {
  it('switches theme and app look (iOS / Android)', async () => {
    const { user, container } = renderApp('/profile?tab=settings', { userId: DEMO_STUDENT_ID });
    await user.click(screen.getByRole('switch', { name: 'Тёмная тема' }));
    expect(document.documentElement).toHaveClass('dark');
    await user.click(screen.getByRole('switch', { name: 'Тёмная тема' }));
    expect(document.documentElement).not.toHaveClass('dark');

    await user.click(screen.getByRole('button', { name: 'Вид приложения' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Вид приложения' })).getByRole('button', {
        name: 'Android',
      }),
    );
    expect(container.querySelector('.device')).toHaveAttribute('data-platform', 'android');
  });

  it('signs out after confirmation', async () => {
    const { user, router } = renderApp('/profile?tab=settings', { userId: DEMO_STUDENT_ID });
    await user.click(screen.getByRole('button', { name: 'Выйти из аккаунта' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Выйти из аккаунта?' })).getByRole('button', {
        name: 'Выйти',
      }),
    );
    expect(useAppStore.getState().session.userId).toBeNull();
    expect(router.state.location.pathname).toBe('/');
  });
});
