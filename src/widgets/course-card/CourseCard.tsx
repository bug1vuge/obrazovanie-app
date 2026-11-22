import { BookOpen, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { examLabel, getTone, type CourseMetrics } from '@/entities/course/lib';
import type { Course } from '@/entities/types';
import { formatPrice, plural, WORDS } from '@/shared/lib/format';
import { Stars } from '@/shared/ui';
import type { CourseStats } from '@/store/selectors';
import { CourseCover } from './CourseCover';

interface CourseCardProps {
  course: Course;
  metrics?: CourseMetrics;
  stats?: CourseStats;
}

export function CourseCard({ course, metrics, stats }: CourseCardProps) {
  const tone = getTone(course.tone);
  const hours = Math.max(1, Math.round((metrics?.totalMinutes ?? 0) / 60));
  return (
    <Link
      to={`/course/${course.id}`}
      className="card card-lift group flex w-full flex-col overflow-hidden"
    >
      <div className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden p-4">
        <CourseCover
          course={course}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          imgClassName="transition duration-500 group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(9,7,18,0.92) 0%, rgba(9,7,18,0.62) 34%, ${tone.from}30 72%, ${tone.from}0a 100%)`,
          }}
        />
        <div className="relative z-10 flex items-start justify-between gap-2">
          <span className="min-w-0 truncate rounded-full bg-black/30 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            {course.category || 'Курс'}
          </span>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-black">
            {formatPrice(course.price)}
          </span>
        </div>
        <h3 className="font-display relative z-10 line-clamp-2 text-[19px] leading-[1.15] text-white drop-shadow-sm">
          {course.title}
        </h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="muted line-clamp-2 text-[13px] leading-snug">
          {course.subtitle || course.description}
        </p>
        <div className="muted mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
          <span className="inline-flex items-center gap-1" title="Уроков">
            <BookOpen size={13} aria-hidden /> {metrics?.lessonsCount ?? 0} ур.
          </span>
          <span className="inline-flex items-center gap-1" title="Длительность">
            <Clock size={13} aria-hidden /> {hours} ч
          </span>
          <span
            className="inline-flex items-center gap-1"
            title={`${stats?.students ?? 0} ${plural(stats?.students ?? 0, WORDS.student)}`}
          >
            <Users size={13} aria-hidden /> {stats?.students ?? 0}
          </span>
          <span className="ml-auto font-semibold text-[rgb(var(--ink))]">
            {examLabel(course.exam)}
          </span>
        </div>
        <div className="hairline-t flex items-center justify-between pt-3">
          <span className="truncate text-[12.5px] font-medium">
            {course.teacherName || 'Преподаватель'}
          </span>
          <Stars
            value={stats?.rating ?? 0}
            count={stats?.reviews ? `(${stats.reviews})` : undefined}
            size={12}
          />
        </div>
      </div>
    </Link>
  );
}
