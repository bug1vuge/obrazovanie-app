import { GraduationCap } from 'lucide-react';
import { forwardRef } from 'react';
import { formatDate } from '@/shared/lib/format';
import { CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from './certificateSize';

interface CertificateViewProps {
  number: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  issuedAt: string;
}

/** Printable certificate. Colours are fixed (not themed) so the PDF looks the same everywhere. */
export const CertificateView = forwardRef<HTMLDivElement, CertificateViewProps>(
  function CertificateView({ number, studentName, courseTitle, teacherName, issuedAt }, ref) {
    return (
      <div
        ref={ref}
        className="print-area bg-white p-10 text-[#171520]"
        style={{ width: CERTIFICATE_WIDTH, height: CERTIFICATE_HEIGHT }}
      >
        <div className="flex h-full flex-col justify-between rounded-xl border-[3px] border-double border-[#3b2f7a] p-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2a2360] text-white">
                <GraduationCap size={18} aria-hidden />
              </span>
              <span className="font-display text-[15px] tracking-tight text-[#2a2360]">
                Study Pro
              </span>
            </div>
            <span className="text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6e6880]">
              Сертификат № {number}
            </span>
          </div>
          <div className="my-4 text-center">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#6e6880]">
              Сертификат о завершении
            </p>
            <p className="mt-3 text-[13px] text-[#5b5668]">
              Настоящий сертификат подтверждает, что
            </p>
            <p className="font-display mt-2 text-[34px] leading-tight text-[#171520]">
              {studentName}
            </p>
            <p className="mt-3 text-[13px] text-[#5b5668]">успешно завершил(а) курс</p>
            <p className="mt-1.5 text-[20px] font-semibold leading-snug text-[#2a2360]">
              {courseTitle}
            </p>
          </div>
          <div className="flex items-end justify-between gap-4 border-t border-[#e3e0ea] pt-4 text-[11px] text-[#5b5668]">
            <div>
              <p className="font-semibold text-[#171520]">{teacherName || 'Study Pro'}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#6e6880]">Преподаватель</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#171520]">{formatDate(issuedAt)}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#6e6880]">Дата выдачи</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#171520]">{number}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#6e6880]">
                Проверка подлинности
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
