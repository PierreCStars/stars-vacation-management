'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { VacationRequest } from '@/types/vacation';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';

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

  // Use next-intl translations
  const tVacations = useTranslations('vacations');
  const tCommon = useTranslations('common');

  // Extract current locale from pathname
  const pathname = usePathname();
  const currentLocale = pathname?.split('/')[1] || 'en';

  // Helper function to create locale-aware links
  const createLocaleLink = (href: string) => `/${currentLocale}${href}`;

  // Fetch existing vacation requests for the calendar
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
      // Calculate duration in days
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.isHalfDay ? formData.startDate : formData.endDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days

      console.log('🔍 Form data:', formData);
      console.log('🔍 Start date:', startDate);
      console.log('🔍 End date:', endDate);
      console.log('🔍 Time diff:', timeDiff);
      console.log('🔍 Calculated durationDays:', durationDays);

      const payload = {
        startDate: formData.startDate,
        endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
        company: formData.company,
        type: formData.type,
        reason: formData.reason,
        isHalfDay: formData.isHalfDay,
        halfDayType: formData.isHalfDay ? formData.halfDayType : null,
        durationDays: formData.isHalfDay ? 0.5 : durationDays
      };

      console.log('📤 Sending payload to API:', payload);

      const response = await fetch('/api/vacation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
        // Refresh the calendar after successful submission
        const refreshResponse = await fetch('/api/vacation-requests');
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setVacationRequests(data);
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
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="w-full max-w-6xl mx-auto px-6">
          {/* Header with Navigation - REMOVED as Navigation component handles it */}
          <div className="text-center mb-8">
            <Link href="/dashboard">
              <Image
                src="/stars-logo.png"
                alt="Stars Logo"
                width={120}
                height={120}
                className="mb-4 drop-shadow-lg mx-auto cursor-pointer"
                priority
              />
            </Link>
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-gray-900">
              {tVacations('title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Submit your vacation request with company details and leave type.
              You can request full days or half days (morning/afternoon).
            </p>
          </div>

          <div className="bg-white/95 rounded-2xl border shadow-xl p-8 backdrop-blur-sm">
            {submitStatus === 'success' ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                  {tVacations('requestSubmittedSuccessfully')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {tVacations('requestSubmittedMessage')}
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    {tVacations('backToDashboard')}
                  </Link>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {tVacations('submitAnotherRequest')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Duration Type */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Duration Type</h3>
                  <div className="flex gap-6">
                    <label className="inline-flex items-center gap-3">
                      <input
                        type="radio"
                        name="duration"
                        value="full"
                        checked={!formData.isHalfDay}
                        onChange={handleInputChange}
                        className="text-blue-600 focus:ring-blue-500 w-5 h-5"
                      />
                      <span className="text-gray-700 font-medium">Full day(s)</span>
                    </label>
                    <label className="inline-flex items-center gap-3">
                      <input
                        type="radio"
                        name="duration"
                        value="half"
                        checked={formData.isHalfDay}
                        onChange={handleInputChange}
                        className="text-blue-600 focus:ring-blue-500 w-5 h-5"
                      />
                      <span className="text-gray-700 font-medium">Half day</span>
                    </label>
                  </div>
                </div>

                {/* Half Day Type */}
                {formData.isHalfDay && (
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Half Day Type</h3>
                    <div className="flex gap-6">
                      <label className="inline-flex items-center gap-3">
                        <input
                          type="radio"
                          name="halfDayType"
                          value="morning"
                          checked={formData.halfDayType === 'morning'}
                          onChange={handleInputChange}
                          className="text-blue-600 focus:ring-blue-500 w-5 h-5"
                        />
                        <span className="text-gray-700 font-medium">Morning (AM) - 09:00 to 13:00</span>
                      </label>
                      <label className="inline-flex items-center gap-3">
                        <input
                          type="radio"
                          name="halfDayType"
                          value="afternoon"
                          checked={formData.halfDayType === 'afternoon'}
                          onChange={handleInputChange}
                          className="text-blue-600 focus:ring-blue-500 w-5 h-5"
                        />
                        <span className="text-gray-700 font-medium">Afternoon (PM) - 14:00 to 18:00</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Date Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      data-testid="start-date"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${formData.isHalfDay ? 'text-gray-400' : 'text-gray-700'}`}>
                      End Date {formData.isHalfDay ? '(Auto-filled for half day)' : '*'}
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.isHalfDay ? formData.startDate : formData.endDate}
                      onChange={handleInputChange}
                      required={!formData.isHalfDay}
                      disabled={formData.isHalfDay}
                      min={formData.startDate}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formData.isHalfDay ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      data-testid="end-date"
                    />
                  </div>
                </div>

                {/* Company and Leave Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <select
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a company</option>
                      <option value="STARS_MC">Stars MC</option>
                      <option value="STARS_YACHTING">Stars Yachting</option>
                      <option value="STARS_REAL_ESTATE">Stars Real Estate</option>
                      <option value="LE_PNEU">Le Pneu</option>
                      <option value="MIDI_PNEU">Midi Pneu</option>
                      <option value="STARS_AVIATION">Stars Aviation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Leave *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select leave type</option>
                      <option value="VACATION">Vacation</option>
                      <option value="SICK_LEAVE">Sick Leave</option>
                      <option value="PERSONAL_DAY">Personal Day</option>
                      <option value="BUSINESS_TRIP">Business Trip</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Please provide a reason for your request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  />
                </div>

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting || !validateForm()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                    data-testid="submit-button"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Calendar Integration */}
          <div className="mt-12 bg-white/95 rounded-2xl border shadow-xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vacation Calendar</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vacation calendar...</p>
              </div>
            ) : (
              <UnifiedVacationCalendar
                vacationRequests={vacationRequests.filter(r => r.status?.toLowerCase() === 'approved')}
                className="w-full"
                showLegend={true}
                compact={false}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
} 