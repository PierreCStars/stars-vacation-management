'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { VacationRequest } from '@/types/vacation';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';
import { createLocaleUrl } from '@/i18n/routing';
import { overlapsForbiddenWindow, resolveLocale, autoDenyMessage } from '@/lib/forbiddenDates';

export default function VacationRequestPage() {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    company: '',
    type: '',
    reason: '',
    isHalfDay: false,
    halfDayType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const startDateInputRef = useRef<HTMLInputElement | null>(null);

  /** Format a Date as `YYYY-MM-DD` using local time (not UTC) so that
   *  clicking June 4 in Monaco resolves to "2026-06-04", not "2026-06-03". */
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  /** Calendar-cell click handler: pre-fill the form's start date with the
   *  clicked day, default the end date to the same day if empty (or move
   *  it forward if it would otherwise sit before the new start), then
   *  scroll the start-date input into view + focus it. */
  const handleCalendarDayClick = (date: Date) => {
    const ymd = toYMD(date);
    setFormData(prev => {
      const nextEnd =
        !prev.endDate || new Date(prev.endDate) < date ? ymd : prev.endDate;
      return { ...prev, startDate: ymd, endDate: nextEnd };
    });
    // Scroll + focus on the next paint so the form is in view.
    setTimeout(() => {
      startDateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startDateInputRef.current?.focus({ preventScroll: true });
    }, 0);
  };

  const tVacations = useTranslations('vacations');
  const tCommon = useTranslations('common');

  const pathname = usePathname();
  const currentLocale = pathname?.split('/')[1] || 'en';

  useEffect(() => {
    const fetchVacationRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vacation-requests');
        if (response.ok) {
          const data = await response.json();
          setVacationRequests(data);
        }
      } catch (error) {
        console.error('Error fetching vacation requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVacationRequests();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'radio') {
      const radioName = (e.target as HTMLInputElement).name;
      if (radioName === 'duration') {
        setFormData(prev => ({
          ...prev,
          isHalfDay: value === 'half',
          halfDayType: value === 'half' ? prev.halfDayType : ''
        }));
      } else if (radioName === 'halfDayType') {
        setFormData(prev => ({
          ...prev,
          halfDayType: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.isHalfDay ? formData.startDate : formData.endDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      const locale = resolveLocale(currentLocale);
      const overlapsForbidden = overlapsForbiddenWindow(startDate, endDate);

      const payload = {
        startDate: formData.startDate,
        endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
        company: formData.company,
        type: formData.type,
        reason: formData.reason,
        isHalfDay: formData.isHalfDay,
        halfDayType: formData.isHalfDay ? formData.halfDayType : null,
        durationDays: formData.isHalfDay ? 0.5 : durationDays,
        ...(overlapsForbidden && {
          status: 'denied',
          denialReason: autoDenyMessage(locale)
        })
      };

      const response = await fetch('/api/vacation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLocale,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (overlapsForbidden) {
          const denyMessage = autoDenyMessage(locale);
          setErrorMessage(denyMessage);
          setSubmitStatus('error');
          setFormData({
            startDate: '',
            endDate: '',
            company: '',
            type: '',
            reason: '',
            isHalfDay: false,
            halfDayType: ''
          });
          const refreshResponse = await fetch('/api/vacation-requests');
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setVacationRequests(data);
          }
        } else {
          setSubmitStatus('success');
          setFormData({
            startDate: '',
            endDate: '',
            company: '',
            type: '',
            reason: '',
            isHalfDay: false,
            halfDayType: ''
          });
          const refreshResponse = await fetch('/api/vacation-requests');
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setVacationRequests(data);
          }
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to submit request');
        setSubmitStatus('error');
      }
    } catch (_error) {
      setErrorMessage('Network error occurred');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!formData.startDate || !formData.company || !formData.type) {
      return false;
    }
    if (!formData.isHalfDay && !formData.endDate) {
      return false;
    }
    if (formData.isHalfDay && !formData.halfDayType) {
      return false;
    }
    if (!formData.isHalfDay && new Date(formData.endDate) < new Date(formData.startDate)) {
      return false;
    }
    return true;
  };

  return (
    <main className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <Link
            href={createLocaleUrl('/dashboard', currentLocale)}
            className="inline-block mb-5 transition-transform hover:scale-105"
            aria-label="Stars"
          >
            {/* SLG brand rule: logo never deformed. Pass real intrinsic
                dimensions (1894x1339) and let h-16 + w-auto preserve ratio. */}
            <Image src="/stars-logo.png" alt="Stars" width={1894} height={1339} className="h-16 w-auto" priority />
          </Link>
          <p className="eyebrow mb-3">Star Luxury Group</p>
          <h1 className="!font-light tracking-tight">
            {tVacations('title')}
          </h1>
          <div className="mt-4 flex justify-center">
            <span className="filet-gold" />
          </div>
          <p className="mt-6 text-base text-slate-ardoise/90 max-w-2xl mx-auto leading-relaxed">
            {tVacations('subtitle')}
          </p>
          <p className="mt-3 text-sm text-slate-ardoise/80 max-w-2xl mx-auto leading-relaxed">
            {tVacations('calendarHint')}
          </p>
        </header>

        <div className="card">
          {submitStatus === 'success' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#ECF5EE] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-[#1F6E3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="!text-2xl !font-semibold mb-3">
                {tVacations('requestSubmittedSuccessfully')}
              </h2>
              <p className="text-sm text-slate-ardoise/90 mb-8 max-w-md mx-auto leading-relaxed">
                {tVacations('requestSubmittedMessage')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href={createLocaleUrl('/dashboard', currentLocale)}
                  className="btn-primary"
                >
                  {tVacations('backToDashboard')}
                </Link>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="btn-secondary"
                >
                  {tVacations('submitAnotherRequest')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Duration type */}
              <fieldset>
                <legend className="eyebrow mb-3">{tVacations('durationType')}</legend>
                <div className="flex flex-wrap gap-3">
                  <label
                    className={`inline-flex items-center gap-3 px-5 py-3 rounded-lg border cursor-pointer transition-colors ${
                      !formData.isHalfDay
                        ? 'border-gold bg-gold/10 text-ink'
                        : 'border-black/10 bg-white text-slate-ardoise hover:border-gold/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value="full"
                      checked={!formData.isHalfDay}
                      onChange={handleInputChange}
                      className="accent-gold w-4 h-4"
                    />
                    <span className="font-medium text-sm">{tVacations('fullDay')}</span>
                  </label>
                  <label
                    className={`inline-flex items-center gap-3 px-5 py-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.isHalfDay
                        ? 'border-gold bg-gold/10 text-ink'
                        : 'border-black/10 bg-white text-slate-ardoise hover:border-gold/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value="half"
                      checked={formData.isHalfDay}
                      onChange={handleInputChange}
                      className="accent-gold w-4 h-4"
                    />
                    <span className="font-medium text-sm">{tVacations('halfDay')}</span>
                  </label>
                </div>
              </fieldset>

              {/* Half day type */}
              {formData.isHalfDay && (
                <fieldset>
                  <legend className="eyebrow mb-3">{tVacations('halfDayType')}</legend>
                  <div className="flex flex-wrap gap-3">
                    <label
                      className={`inline-flex items-center gap-3 px-5 py-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.halfDayType === 'morning'
                          ? 'border-gold bg-gold/10 text-ink'
                          : 'border-black/10 bg-white text-slate-ardoise hover:border-gold/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="halfDayType"
                        value="morning"
                        checked={formData.halfDayType === 'morning'}
                        onChange={handleInputChange}
                        className="accent-gold w-4 h-4"
                      />
                      <span className="font-medium text-sm">{tVacations('morning')}</span>
                    </label>
                    <label
                      className={`inline-flex items-center gap-3 px-5 py-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.halfDayType === 'afternoon'
                          ? 'border-gold bg-gold/10 text-ink'
                          : 'border-black/10 bg-white text-slate-ardoise hover:border-gold/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="halfDayType"
                        value="afternoon"
                        checked={formData.halfDayType === 'afternoon'}
                        onChange={handleInputChange}
                        className="accent-gold w-4 h-4"
                      />
                      <span className="font-medium text-sm">{tVacations('afternoon')}</span>
                    </label>
                  </div>
                </fieldset>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="eyebrow block mb-2" htmlFor="startDate">
                    {tVacations('startDate')} *
                  </label>
                  <input
                    id="startDate"
                    ref={startDateInputRef}
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                    data-testid="start-date"
                  />
                </div>
                <div>
                  <label
                    className={`eyebrow block mb-2 ${formData.isHalfDay ? 'opacity-40' : ''}`}
                    htmlFor="endDate"
                  >
                    {tVacations('endDate')} {formData.isHalfDay ? tVacations('autoFilledForHalfDay') : '*'}
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={formData.isHalfDay ? formData.startDate : formData.endDate}
                    onChange={handleInputChange}
                    required={!formData.isHalfDay}
                    disabled={formData.isHalfDay}
                    min={formData.startDate}
                    className={`input-field ${formData.isHalfDay ? 'bg-cream-100 cursor-not-allowed opacity-60' : ''}`}
                    data-testid="end-date"
                  />
                </div>
              </div>

              {/* Company + leave type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="eyebrow block mb-2" htmlFor="company">
                    {tVacations('company')} *
                  </label>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">{tVacations('selectCompany')}</option>
                    <option value="STARS_MC">Stars MC</option>
                    <option value="STARS_YACHTING">Stars Yachting</option>
                    <option value="STARS_REAL_ESTATE">Stars Real Estate</option>
                    <option value="LE_PNEU">Le Pneu</option>
                    <option value="MIDI_PNEU">Midi Pneu</option>
                    <option value="STARS_AVIATION">Stars Aviation</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-2" htmlFor="type">
                    {tVacations('typeOfLeave')} *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">{tVacations('selectLeaveType')}</option>
                    <option value="PAID_LEAVE">{tVacations('paidLeave')}</option>
                    <option value="UNPAID_LEAVE">{tVacations('unpaidLeave')}</option>
                    <option value="FAMILY_EVENT_LEAVE">{tVacations('familyEventLeave')}</option>
                    <option value="OVERTIME_COMPENSATION">{tVacations('overtimeCompensation')}</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="eyebrow block mb-2" htmlFor="reason">
                  {tVacations('reasonOptional')}
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={tVacations('reasonPlaceholder')}
                  className="input-field resize-vertical"
                />
              </div>

              {/* Error */}
              {submitStatus === 'error' && (
                <div className="bg-[#FBECEE] border border-[#8E2630]/20 rounded-lg p-4">
                  <p className="text-sm text-[#8E2630] font-medium">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-black/5">
                <Link
                  href={createLocaleUrl('/dashboard', currentLocale)}
                  className="btn-secondary"
                >
                  {tCommon('cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !validateForm()}
                  className="btn-primary"
                  data-testid="submit-button"
                >
                  {isSubmitting ? tVacations('submitting') : tVacations('submitRequest')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Calendar */}
        <section className="card mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="!text-xl !font-semibold">Vacation Calendar</h2>
            <span className="hidden sm:block filet-gold !w-12" />
          </div>
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin mb-3" />
              <p className="text-sm text-slate-ardoise">Loading vacation calendar…</p>
            </div>
          ) : (
            <UnifiedVacationCalendar
              vacationRequests={vacationRequests.filter(r => r.status?.toLowerCase() === 'approved')}
              className="w-full"
              showLegend={true}
              compact={false}
              onDayClick={handleCalendarDayClick}
            />
          )}
        </section>
      </div>
    </main>
  );
}
