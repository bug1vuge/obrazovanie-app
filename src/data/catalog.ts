import type { CourseExam } from '@/entities/types';
import type { TeacherId } from './teachers';

interface BaseSpec {
  id: string;
  subject: string;
  teacherId: TeacherId;
  price: number;
  /** Unsplash photo id — every course has its own, never repeated. */
  cover: string;
}

/** Courses built from the shared template: 2 modules, 4 lessons, module tests. */
export interface TemplateCourseSpec extends BaseSpec {
  format: 'expert' | 'students';
  exam: CourseExam;
}

export interface FlagshipLessonSpec {
  title: string;
  duration: number;
  summary: string;
}

export interface FlagshipCourseSpec extends BaseSpec {
  format: 'flagship';
  exam: CourseExam;
  title: string;
  subtitle: string;
  description: string;
  modules: readonly { title: string; lessons: readonly FlagshipLessonSpec[] }[];
}

export type CourseSpec = TemplateCourseSpec | FlagshipCourseSpec;

const PRICE = {
  expertEge: 2490,
  expertOge: 1990,
  students: 0,
  flagship: 3990,
  flagshipPremium: 4990,
} as const;

const expert = (
  id: string,
  subject: string,
  exam: 'ege' | 'oge',
  teacherId: TeacherId,
  cover: string,
): TemplateCourseSpec => ({
  id,
  subject,
  exam,
  teacherId,
  cover,
  format: 'expert',
  price: exam === 'ege' ? PRICE.expertEge : PRICE.expertOge,
});

const students = (
  id: string,
  subject: string,
  teacherId: TeacherId,
  cover: string,
): TemplateCourseSpec => ({
  id,
  subject,
  exam: 'both',
  teacherId,
  cover,
  format: 'students',
  price: PRICE.students,
});

/**
 * The catalog in the order of the original platform. Order matters: the
 * «Новые» sort reproduces it, newest first.
 */
export const COURSE_SPECS: readonly CourseSpec[] = [
  students('sp-eng-students', 'eng', 't-orlov', 'photo-1533929736458-ca588d08c8be'),
  students('sp-inf-students', 'inf', 't-biryukov', 'photo-1607799279861-4dd421887fb3'),
  expert('sp-geo-ege-expert', 'geo', 'ege', 't-belskaya', 'photo-1521295121783-8a321d551ad2'),
  expert('sp-geo-oge-expert', 'geo', 'oge', 't-belskaya', 'photo-1524661135-423995f22d0b'),
  students('sp-geo-students', 'geo', 't-savelev', 'photo-1619468129361-605ebea04b44'),
  expert('sp-lit-ege-expert', 'lit', 'ege', 't-ilina', 'photo-1524995997946-a1c2e315a42f'),
  expert('sp-lit-oge-expert', 'lit', 'oge', 't-ilina', 'photo-1457369804613-52c61a468e7d'),
  students('sp-lit-students', 'lit', 't-kovaleva-n', 'photo-1541963463532-d68292c34b19'),
  expert('sp-eng-oge-expert', 'eng', 'oge', 't-morozova', 'photo-1486299267070-83823f5448dd'),
  expert('sp-rus-oge-expert', 'rus', 'oge', 't-kuznetsova', 'photo-1517971071642-34a2d3ecc9cd'),
  students('sp-rus-students', 'rus', 't-ershova', 'photo-1579017308347-e53e0d2fc5e9'),
  expert(
    'sp-math-base-ege-expert',
    'math-base',
    'ege',
    't-titova',
    'photo-1509228468518-180dd4864904',
  ),
  expert(
    'sp-math-base-oge-expert',
    'math-base',
    'oge',
    't-titova',
    'photo-1518133910546-b6c2fb7d79e3',
  ),
  students('sp-math-base-students', 'math-base', 't-lebedev-a', 'photo-1676302447092-14a103558511'),
  expert(
    'sp-math-prof-oge-expert',
    'math-prof',
    'oge',
    't-sokolova',
    'photo-1635372722656-389f87a941b7',
  ),
  students('sp-math-prof-students', 'math-prof', 't-astakhov', 'photo-1758685734622-3e0a002b2f53'),
  expert('sp-soc-oge-expert', 'soc', 'oge', 't-pavlov', 'photo-1517732306149-e8f829eb588a'),
  students('sp-soc-students', 'soc', 't-kim', 'photo-1590341279043-2e7b19d8c2c2'),
  expert('sp-hist-oge-expert', 'hist', 'oge', 't-vetrova', 'photo-1760307837850-13db8b0d94cb'),
  students('sp-hist-students', 'hist', 't-voronov', 'photo-1779293109155-2cda395601d1'),
  expert('sp-phys-oge-expert', 'phys', 'oge', 't-dyachenko', 'photo-1507413245164-6160d8298b31'),
  students('sp-phys-students', 'phys', 't-gushchin', 'photo-1633493702341-4d04841df53b'),
  expert('sp-chem-oge-expert', 'chem', 'oge', 't-marchenko', 'photo-1532094349884-543bc11b234d'),
  students('sp-chem-students', 'chem', 't-gareeva', 'photo-1694230155228-cdde50083573'),
  expert('sp-bio-oge-expert', 'bio', 'oge', 't-romanova', 'photo-1576086213369-97a306d36557'),
  students('sp-bio-students', 'bio', 't-tkachenko', 'photo-1526930382372-67bf22c0fce2'),
  expert('sp-inf-ege-expert', 'inf', 'ege', 't-koltsov', 'photo-1461749280684-dccba630e2f6'),
  expert('sp-inf-oge-expert', 'inf', 'oge', 't-koltsov', 'photo-1498050108023-c5249f4df085'),
  {
    id: 'k-eng',
    subject: 'eng',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-orlova',
    price: PRICE.flagship,
    cover: 'photo-1513635269975-59663e0ac1ad',
    title: 'Английский язык: ЕГЭ, письмо и говорение',
    subtitle: 'Грамматика, лексика и шаблоны письма, за которые действительно дают баллы',
    description:
      'Курс для тех, кто хочет уверенно сдать письменную и устную часть ЕГЭ по английскому.\n\nРазбираем грамматику и словообразование в формате экзамена, учим шаблоны личного письма и эссе, тренируем монолог и ответы на вопросы.\n\nВ каждом модуле — короткая теория, разбор заданий и тест с автопроверкой.',
    modules: [
      {
        title: 'Грамматика и лексика',
        lessons: [
          {
            title: 'Как устроен ЕГЭ по английскому',
            duration: 12,
            summary: 'Разделы экзамена, время и баллы — с чего начать подготовку.',
          },
          {
            title: 'Времена и пассивный залог',
            duration: 20,
            summary: 'Как выбрать форму глагола в заданиях на преобразование.',
          },
          {
            title: 'Словообразование без ошибок',
            duration: 18,
            summary: 'Суффиксы и приставки, которые встречаются чаще всего.',
          },
        ],
      },
      {
        title: 'Письмо и устная часть',
        lessons: [
          {
            title: 'Личное письмо: структура и клише',
            duration: 22,
            summary: 'Обязательные элементы письма и типичные ошибки.',
          },
          {
            title: 'Эссе «Проект»: план и аргументы',
            duration: 26,
            summary: 'Как раскрыть все пункты плана и уложиться в объём.',
          },
          {
            title: 'Монолог и интервью',
            duration: 24,
            summary: 'Схема устного ответа, которая не даёт растеряться.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-hist',
    subject: 'hist',
    format: 'flagship',
    exam: 'both',
    teacherId: 't-timofeev',
    price: PRICE.flagship,
    cover: 'photo-1505664194779-8beaceb93744',
    title: 'История России: ЕГЭ и ОГЭ на высокий балл',
    subtitle: 'Даты, карты и культура — системой, а не бесконечной зубрёжкой',
    description:
      'История России от Древней Руси до наших дней — в виде понятной системы.\n\nСвязываем даты с событиями и личностями, работаем с картой, источниками и культурой, учимся писать историческое сочинение.\n\nПодходит для подготовки к ОГЭ и ЕГЭ: задания обоих экзаменов разобраны отдельно.',
    modules: [
      {
        title: 'От Руси до империи',
        lessons: [
          {
            title: 'Как устроен экзамен по истории',
            duration: 12,
            summary: 'Структура ЕГЭ и ОГЭ, на чём теряют баллы.',
          },
          {
            title: 'Древняя Русь и раздробленность',
            duration: 22,
            summary: 'Ключевые даты и князья IX–XIII веков.',
          },
          {
            title: 'Московское царство и Смута',
            duration: 20,
            summary: 'Объединение земель, Иван Грозный и Смутное время.',
          },
        ],
      },
      {
        title: 'Империя и XX век',
        lessons: [
          {
            title: 'Петровские реформы и XVIII век',
            duration: 22,
            summary: 'Реформы, войны и дворцовые перевороты.',
          },
          {
            title: 'XIX век: реформы и контрреформы',
            duration: 24,
            summary: 'Великие реформы Александра II и их последствия.',
          },
          {
            title: 'XX век и культура',
            duration: 26,
            summary: 'Революции, войны и культура — с картами и источниками.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-social',
    subject: 'soc',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-guseva',
    price: PRICE.flagship,
    cover: 'photo-1603644448048-28a7e5122f0a',
    title: 'Обществознание: ЕГЭ на 90+',
    subtitle: 'Человек и общество, экономика, право — с планами и разбором второй части',
    description:
      'Курс закрывает все блоки кодификатора ЕГЭ по обществознанию.\n\nРазбираем понятия, которые чаще всего встречаются в заданиях, учимся составлять сложный план и решать задания на право и экономику.\n\nПосле каждого модуля — тест с автопроверкой и разбором ошибок.',
    modules: [
      {
        title: 'Человек, общество, экономика',
        lessons: [
          {
            title: 'Как устроен ЕГЭ по обществознанию',
            duration: 12,
            summary: 'Структура экзамена и стратегия набора баллов.',
          },
          {
            title: 'Человек и общество',
            duration: 20,
            summary: 'Деятельность, познание, социальные институты.',
          },
          {
            title: 'Экономика: рынок и государство',
            duration: 24,
            summary: 'Спрос и предложение, налоги, функции государства.',
          },
        ],
      },
      {
        title: 'Политика, право и вторая часть',
        lessons: [
          {
            title: 'Политика и Конституция РФ',
            duration: 22,
            summary: 'Формы государства, органы власти, выборы.',
          },
          {
            title: 'Право: отрасли и задачи',
            duration: 24,
            summary: 'Гражданское, трудовое и административное право.',
          },
          {
            title: 'Сложный план на максимальный балл',
            duration: 20,
            summary: 'Как составить план, который засчитают полностью.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-chem',
    subject: 'chem',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-nikitina',
    price: PRICE.flagship,
    cover: 'photo-1628863353691-0071c8c1874c',
    title: 'Химия: ЕГЭ, реакции и расчётные задачи',
    subtitle: 'От строения атома до органики — со схемами, которые запоминаются',
    description:
      'Курс выстраивает химию в систему: от строения атома и периодического закона до органических цепочек.\n\nОтдельный модуль — расчётные задачи второй части с единым алгоритмом решения.\n\nВ каждом модуле — разбор типовых заданий и тест с автопроверкой.',
    modules: [
      {
        title: 'Общая и неорганическая химия',
        lessons: [
          {
            title: 'Как устроен ЕГЭ по химии',
            duration: 12,
            summary: 'Структура экзамена и критерии второй части.',
          },
          {
            title: 'Строение атома и периодический закон',
            duration: 22,
            summary: 'Электронные конфигурации и свойства элементов.',
          },
          {
            title: 'Классы неорганических веществ',
            duration: 24,
            summary: 'Свойства и генетические ряды.',
          },
        ],
      },
      {
        title: 'Органика и расчёты',
        lessons: [
          {
            title: 'Органическая химия: цепочки',
            duration: 26,
            summary: 'Как читать и составлять цепочки превращений.',
          },
          {
            title: 'ОВР и электролиз',
            duration: 24,
            summary: 'Метод электронного баланса и продукты электролиза.',
          },
          {
            title: 'Расчётные задачи второй части',
            duration: 26,
            summary: 'Единый алгоритм для задач на смеси и выход.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-bio',
    subject: 'bio',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-savelyeva',
    price: PRICE.flagship,
    cover: 'photo-1633167606207-d840b5070fc2',
    title: 'Биология: ЕГЭ, генетика и анатомия',
    subtitle: 'Клетка, организм и экосистемы — с задачами на генетику без слёз',
    description:
      'Курс охватывает все разделы ЕГЭ по биологии и особенно подробно — генетику и анатомию человека.\n\nРешаем задачи по критериям ФИПИ, разбираем рисунки и схемы, учимся отвечать на вопросы второй части.\n\nПосле каждого модуля — тест с автопроверкой.',
    modules: [
      {
        title: 'Клетка и генетика',
        lessons: [
          {
            title: 'Как устроен ЕГЭ по биологии',
            duration: 12,
            summary: 'Структура экзамена и самые «дорогие» задания.',
          },
          {
            title: 'Клетка и обмен веществ',
            duration: 22,
            summary: 'Органоиды, фотосинтез, энергетический обмен.',
          },
          {
            title: 'Генетика: задачи по критериям',
            duration: 26,
            summary: 'Моно- и дигибридное скрещивание, сцепление с полом.',
          },
        ],
      },
      {
        title: 'Организм и экосистемы',
        lessons: [
          { title: 'Анатомия человека', duration: 24, summary: 'Системы органов и их регуляция.' },
          {
            title: 'Эволюция и экология',
            duration: 22,
            summary: 'Движущие силы эволюции, цепи питания.',
          },
          {
            title: 'Вторая часть: развёрнутые ответы',
            duration: 20,
            summary: 'Как отвечать, чтобы получить все баллы.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-math',
    subject: 'math-prof',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-kovaleva-a',
    price: PRICE.flagshipPremium,
    cover: 'photo-1636466497217-26a8cbeaf0aa',
    title: 'Математика: ЕГЭ профиль с нуля до 80+',
    subtitle: 'Алгебра, геометрия и параметр — по шагам, с разбором реальных заданий ФИПИ',
    description:
      'Курс для тех, кто хочет набрать на профильном ЕГЭ более 80 баллов и не потерять время на «зубрёжку» формул.\n\nМы разберём экзамен по частям: какие задания дают баллы дешевле всего, где чаще всего теряют баллы и как оформлять решения, чтобы эксперт их засчитал.\n\nВ каждом модуле — короткая теория, разбор прототипов ФИПИ и тренировочный тест с автопроверкой.',
    modules: [
      {
        title: 'Алгебра и вычисления',
        lessons: [
          {
            title: 'Как устроен профильный экзамен',
            duration: 12,
            summary: 'Структура, баллы и стратегия решения.',
          },
          {
            title: 'Проценты, доли и текстовые задачи',
            duration: 18,
            summary: 'Задачи на движение, работу и проценты.',
          },
          {
            title: 'Уравнения и неравенства: короткие приёмы',
            duration: 22,
            summary: 'Метод интервалов, ОДЗ и проверка корней.',
          },
        ],
      },
      {
        title: 'Функции, геометрия и параметр',
        lessons: [
          {
            title: 'Графики функций и производная',
            duration: 24,
            summary: 'Чтение графиков, экстремумы, наибольшее значение.',
          },
          {
            title: 'Планиметрия: треугольники и окружность',
            duration: 24,
            summary: 'Подобие, вписанные углы, теорема синусов.',
          },
          {
            title: 'Задача с параметром: метод областей',
            duration: 26,
            summary: 'Графический подход к задачам с параметром.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-phys',
    subject: 'phys',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-lebedev-d',
    price: PRICE.flagship,
    cover: 'photo-1782926017531-68d4ebeb382d',
    title: 'Физика: ЕГЭ от механики до оптики',
    subtitle: 'Только нужные формулы и задачи, которые действительно встречаются',
    description:
      'Курс проходит все разделы ЕГЭ по физике: механику, молекулярную физику, электродинамику и оптику.\n\nВ центре — задачи: как перевести условие в формулы, выбрать закон и проверить ответ по размерности.\n\nПосле каждого модуля — тест с автопроверкой.',
    modules: [
      {
        title: 'Механика и молекулярная физика',
        lessons: [
          {
            title: 'Как устроен ЕГЭ по физике',
            duration: 12,
            summary: 'Структура экзамена и критерии оценивания.',
          },
          {
            title: 'Кинематика и динамика',
            duration: 24,
            summary: 'Законы Ньютона и движение по окружности.',
          },
          {
            title: 'Законы сохранения и термодинамика',
            duration: 24,
            summary: 'Энергия, импульс, газовые законы.',
          },
        ],
      },
      {
        title: 'Электродинамика и оптика',
        lessons: [
          {
            title: 'Электрические цепи',
            duration: 22,
            summary: 'Закон Ома, соединения, работа и мощность тока.',
          },
          {
            title: 'Магнетизм и индукция',
            duration: 22,
            summary: 'Сила Ампера, сила Лоренца, правило Ленца.',
          },
          {
            title: 'Геометрическая оптика',
            duration: 22,
            summary: 'Линзы, преломление и построение изображений.',
          },
        ],
      },
    ],
  },
  {
    id: 'k-rus',
    subject: 'rus',
    format: 'flagship',
    exam: 'ege',
    teacherId: 't-sokolova',
    price: PRICE.flagshipPremium,
    cover: 'photo-1462642109801-4ac2971a3a51',
    title: 'Русский язык: ЕГЭ, сочинение и изложение без паники',
    subtitle: 'Орфография, пунктуация и итоговое сочинение по критериям эксперта',
    description:
      'Курс закрывает тестовую часть ЕГЭ по русскому языку и учит писать сочинение по критериям эксперта.\n\nПравила орфографии и пунктуации даны в виде коротких алгоритмов, а сочинение разобрано по шагам: проблема, комментарий, позиция автора и аргумент.\n\nВ каждом модуле — тренировочный тест с автопроверкой.',
    modules: [
      {
        title: 'Тестовая часть',
        lessons: [
          {
            title: 'Как устроен ЕГЭ по русскому',
            duration: 12,
            summary: 'Структура экзамена и распределение баллов.',
          },
          {
            title: 'Орфография: алгоритмы правил',
            duration: 22,
            summary: 'Корни, приставки, суффиксы и Н/НН.',
          },
          {
            title: 'Пунктуация: схемы предложений',
            duration: 22,
            summary: 'Запятые в сложных предложениях и при оборотах.',
          },
        ],
      },
      {
        title: 'Сочинение',
        lessons: [
          {
            title: 'Проблема и комментарий',
            duration: 24,
            summary: 'Как сформулировать проблему и подобрать примеры.',
          },
          {
            title: 'Позиция автора и аргумент',
            duration: 22,
            summary: 'Как согласиться с автором и обосновать мнение.',
          },
          {
            title: 'Речевые ошибки и проверка',
            duration: 18,
            summary: 'Чек-лист самопроверки перед сдачей.',
          },
        ],
      },
    ],
  },
];

/** Extra course of the demo teacher, waiting for moderation. */
export const DRAFT_COURSE_ID = 'draft-sokolova-geometry';
