import type { Category, CourseStatus, ID } from '@/entities/types';
import { createId } from '@/shared/lib/id';
import { DomainError } from '../errors';
import { patch, removeWhere, upsert, values } from '../table';
import type { SliceCreator, StoreDeps } from '../types';
import { requireOwner } from './guards';

export interface AdminSlice {
  setCourseStatus: (courseId: ID, status: CourseStatus) => void;
  deleteCourse: (courseId: ID) => void;
  addCategory: (name: string) => Category;
  deleteCategory: (categoryId: ID) => void;
}

export const createAdminSlice =
  (deps: StoreDeps): SliceCreator<AdminSlice> =>
  (set, get) => ({
    setCourseStatus: (courseId, status) => {
      const state = get();
      requireOwner(state);
      if (!state.db.courses[courseId]) throw new DomainError('Курс не найден');
      set({
        db: {
          ...state.db,
          courses: patch(state.db.courses, courseId, {
            status,
            updatedAt: deps.now().toISOString(),
          }),
        },
      });
    },

    deleteCourse: (courseId) => {
      const state = get();
      requireOwner(state);
      const belongs = (item: { courseId: ID }) => item.courseId === courseId;
      // Enrollments are kept on purpose: they are the financial history.
      set({
        db: {
          ...state.db,
          courses: removeWhere(state.db.courses, (course) => course.id === courseId),
          modules: removeWhere(state.db.modules, belongs),
          lessons: removeWhere(state.db.lessons, belongs),
          quizzes: removeWhere(state.db.quizzes, belongs),
          reviews: removeWhere(state.db.reviews, belongs),
        },
      });
    },

    addCategory: (name) => {
      const state = get();
      requireOwner(state);
      const trimmed = name.trim();
      if (!trimmed) throw new DomainError('Введите название предмета');
      const categories = values(state.db.categories);
      if (categories.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new DomainError('Такой предмет уже есть');
      }
      const category: Category = {
        id: createId('cat'),
        name: trimmed,
        order: categories.reduce((max, item) => Math.max(max, item.order), -1) + 1,
      };
      set({ db: { ...state.db, categories: upsert(state.db.categories, category) } });
      return category;
    },

    deleteCategory: (categoryId) => {
      const state = get();
      requireOwner(state);
      set({
        db: {
          ...state.db,
          categories: removeWhere(state.db.categories, (item) => item.id === categoryId),
        },
      });
    },
  });
