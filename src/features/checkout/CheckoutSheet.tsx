import { CreditCard, Lock, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { applyPromo } from '@/entities/enrollment/lib';
import type { Course, PromoCode } from '@/entities/types';
import { formatPrice } from '@/shared/lib/format';
import { Button, Notice } from '@/shared/ui';
import { Sheet } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';

/** Delay that imitates the payment provider round-trip in the demo. */
export const DEMO_PAYMENT_DELAY_MS = 900;

interface CheckoutSheetProps {
  course: Course;
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}

/** Checkout as a bottom sheet: promo code, total and a (simulated) payment. */
export function CheckoutSheet({ course, open, onClose, onPaid }: CheckoutSheetProps) {
  const enroll = useAppStore((state) => state.enroll);
  const findPromo = useAppStore((state) => state.findPromo);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const total = applyPromo(course.price, promo);

  useEffect(() => () => clearTimeout(timer.current), []);

  const applyCode = () => {
    if (!promoInput.trim()) return;
    try {
      setPromo(findPromo(promoInput));
      setPromoError('');
    } catch (err) {
      setPromo(null);
      setPromoError(errorMessage(err));
    }
  };

  const pay = () => {
    setError('');
    setProcessing(true);
    timer.current = setTimeout(() => {
      try {
        enroll(course.id, promo?.code ?? null);
        onPaid();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setProcessing(false);
      }
    }, DEMO_PAYMENT_DELAY_MS);
  };

  return (
    <Sheet
      open={open}
      onClose={processing ? () => undefined : onClose}
      title="Оплата курса"
      footer={
        <Button size="lg" className="w-full" onClick={pay} disabled={processing}>
          <CreditCard size={18} aria-hidden />
          {processing ? 'Проводим оплату…' : `Оплатить ${formatPrice(total)}`}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="soft-bg rounded-2xl p-4">
          <p className="muted text-[12px] uppercase tracking-wide">Курс</p>
          <p className="font-display mt-1 text-[15px] leading-snug">{course.title}</p>
          <p className="muted mt-1 text-[12.5px]">{course.teacherName}</p>
        </div>

        <div>
          <div className="flex gap-2">
            <input
              value={promoInput}
              onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
              onKeyDown={(event) => event.key === 'Enter' && applyCode()}
              placeholder="Промокод"
              className="inp uppercase"
              aria-label="Промокод"
              autoCapitalize="characters"
            />
            <Button variant="soft" onClick={applyCode}>
              ОК
            </Button>
          </div>
          {promoError && (
            <p role="alert" className="mt-1.5 text-[12.5px] text-red-500">
              {promoError}
            </p>
          )}
        </div>

        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex justify-between">
            <dt className="muted">Стоимость</dt>
            <dd>{formatPrice(course.price)}</dd>
          </div>
          {promo && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <dt className="inline-flex items-center gap-1">
                <Tag size={14} aria-hidden /> Промокод {promo.code}
              </dt>
              <dd>−{promo.percent}%</dd>
            </div>
          )}
          <div className="hairline-t flex justify-between pt-2 font-semibold">
            <dt>Итого</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
        {error && <Notice tone="error">{error}</Notice>}
        <p className="muted flex items-start gap-2 text-[12px] leading-snug">
          <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
          Демо-режим: оплата имитируется, деньги не списываются. В приложении здесь будут Apple Pay,
          Google Pay и банковские карты.
        </p>
      </div>
    </Sheet>
  );
}
