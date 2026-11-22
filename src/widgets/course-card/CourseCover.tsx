import { useState } from 'react';
import { coverSources, getTone } from '@/entities/course/lib';
import type { Course } from '@/entities/types';
import { cn } from '@/shared/lib/cn';

/** Course photo on top of the course tone gradient (gradient stays if the image fails). */
export function CourseCover({
  course,
  className,
  imgClassName,
  sizes = '100vw',
}: {
  course: Pick<Course, 'coverUrl' | 'tone'>;
  className?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const tone = getTone(course.tone);
  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ background: `linear-gradient(140deg, ${tone.from}, ${tone.to})` }}
    >
      {course.coverUrl && !failed && (
        <img
          {...coverSources(course.coverUrl)}
          alt=""
          loading="lazy"
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
        />
      )}
    </div>
  );
}
