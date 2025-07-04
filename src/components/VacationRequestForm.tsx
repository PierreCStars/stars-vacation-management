'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signOut } from 'next-auth/react';

const CompanyEnum = z.enum([
  'STARS_MC',
  'STARS_YACHTING',
  'STARS_AVIATION',
  'STARS_REAL_ESTATE',
  'LE_PNEU',
  'MIDI_PNEU',
]);

const TypeEnum = z.enum([
  'PAID_VACATION',
  'UNPAID_VACATION',
  'SICK_LEAVE',
  'OTHER',
]);

const vacationRequestSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
  company: CompanyEnum,
  type: TypeEnum,
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

type VacationRequestFormData = z.infer<typeof vacationRequestSchema>;

export function VacationRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<VacationRequestFormData>({
    resolver: zodResolver(vacationRequestSchema),
    defaultValues: {
      company: 'STARS_MC',
      type: 'PAID_VACATION',
    },
  });

  const watchedCompany = watch('company');

  const onSubmit = async (data: VacationRequestFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/vacation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If 400, show popup with missing fields
        if (response.status === 400 && errorData.error) {
          // Try to extract missing fields from the error message if possible
          let missingFields = [];
          if (errorData.error.toLowerCase().includes('missing')) {
            if (!data.startDate) missingFields.push('Start Date');
            if (!data.endDate) missingFields.push('End Date');
            if (!data.company) missingFields.push('Company');
            if (!data.type) missingFields.push('Type');
          }
          if (missingFields.length > 0) {
            alert('Please fill in the following required fields:\n' + missingFields.join(', '));
          } else {
            alert(errorData.error);
          }
        }
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSubmitStatus('processing');
      reset();
      // Show processing message for 4 seconds, then sign out
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 4000);
    } catch (error) {
      console.error('Error submitting vacation request:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      // Clear error message after 10 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 10000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        Submit Vacation Request
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Selection */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            Company *
          </label>
          <select
            id="company"
            {...register('company')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base"
            style={{ fontFamily: 'Montserrat, sans-serif', padding: '5px' }}
          >
            <option value="STARS_MC">Stars MC</option>
            <option value="STARS_YACHTING">Stars Yachting</option>
            <option value="STARS_AVIATION">Stars Aviation</option>
            <option value="STARS_REAL_ESTATE">Stars Real Estate</option>
            <option value="LE_PNEU">Le Pneu</option>
            <option value="MIDI_PNEU">Midi Pneu</option>
          </select>
          {errors.company && (
            <p className="mt-2 text-sm text-red-600">{errors.company.message}</p>
          )}
        </div>

        {/* Type Selection */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Type *
          </label>
          <select
            id="type"
            {...register('type')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base"
            style={{ fontFamily: 'Montserrat, sans-serif', padding: '5px' }}
          >
            <option value="PAID_VACATION">Paid Vacation</option>
            <option value="UNPAID_VACATION">Unpaid vacation</option>
            <option value="SICK_LEAVE">Sick Leave</option>
            <option value="OTHER">Other (precise in comment)</option>
          </select>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              {...register('startDate')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base"
              style={{ fontFamily: 'Montserrat, sans-serif', padding: '5px' }}
            />
            {errors.startDate && (
              <p className="mt-2 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              {...register('endDate')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base"
              style={{ fontFamily: 'Montserrat, sans-serif', padding: '5px' }}
            />
            {errors.endDate && (
              <p className="mt-2 text-sm text-red-600">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <textarea
            id="reason"
            {...register('reason')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-base"
            placeholder="Please provide a reason for your vacation request..."
            style={{ fontFamily: 'Montserrat, sans-serif', padding: '5px' }}
          />
          {errors.reason && (
            <p className="mt-2 text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>

        {/* Status Messages */}
        {submitStatus === 'processing' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center" style={{ padding: '5px' }}>
              <p className="text-sm font-medium text-blue-800">
                Your request is being processed. You will receive an email soon. Thank you.
                <br />
                You will now be logged out. Have a good day!
              </p>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Error: {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center items-center pt-4" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center border border-transparent text-lg font-bold shadow-lg bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            style={{ 
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: '700',
              backgroundColor: '#dc2626',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '10px',
              boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.3), 0 4px 6px -2px rgba(220, 38, 38, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.3), 0 4px 6px -2px rgba(220, 38, 38, 0.1)';
            }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'SUBMIT VACATION REQUEST'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 