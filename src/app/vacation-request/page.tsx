'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function VacationRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    company: '',
    type: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <main 
        className="min-h-screen flex flex-col items-center justify-center py-12"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3rem',
          paddingBottom: '3rem'
        }}
      >
        <div 
          className="w-full max-w-4xl"
          style={{ 
            width: '100%', 
            maxWidth: '896px', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem' 
          }}
        >
          <div 
            className="text-center mb-8"
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <Link href="/dashboard">
              <Image 
                src="/stars-logo.png" 
                alt="Stars Logo" 
                width={180}
                height={180}
                style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
                className="mb-6 drop-shadow-lg"
                priority 
              />
            </Link>
            <h1 
              className="text-5xl font-bold tracking-tight mb-6 text-gray-900"
              style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                color: '#111827', 
                letterSpacing: '-0.025em', 
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {t.vacationRequest.title}
            </h1>
          </div>
          <div 
            className="card text-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ width: 64, height: 64, border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px auto' }}></div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              {t.common.loading}
            </h2>
            <p style={{ color: '#6b7280' }}>Please wait while we load the form.</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/vacation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          startDate: '',
          endDate: '',
          company: '',
          type: '',
          reason: ''
        });
      } else {
        const error = await response.json();
        setErrorMessage(error.error || t.vacationRequest.error);
        setSubmitStatus('error');
      }
    } catch (error) {
      setErrorMessage(t.vacationRequest.error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!formData.startDate || !formData.endDate || !formData.company || !formData.type) {
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      return false;
    }
    return true;
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-start py-12"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '3rem',
        paddingBottom: '3rem'
      }}
    >
      <div 
        className="w-full max-w-4xl"
        style={{ 
          width: '100%', 
          maxWidth: '896px', 
          paddingLeft: '1.5rem', 
          paddingRight: '1.5rem' 
        }}
      >
        {/* Header with Language Selector */}
        <div 
          className="flex justify-between items-center mb-8"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}
        >
          <Link 
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold"
            style={{ 
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            ← {t.common.back}
          </Link>
          <LanguageSelector />
        </div>

        <div 
          className="text-center mb-8"
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <Link href="/dashboard">
            <Image 
              src="/stars-logo.png" 
              alt="Stars Logo" 
              width={120}
              height={120}
              style={{ maxWidth: 120, maxHeight: 120, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
              className="mb-4 drop-shadow-lg"
              priority 
            />
          </Link>
          <h1 
            className="text-4xl font-bold tracking-tight mb-4 text-gray-900"
            style={{ 
              fontSize: '2.25rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {t.vacationRequest.title}
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ 
              fontSize: '1.125rem', 
              color: '#4b5563',
              lineHeight: 1.6
            }}
          >
            {t.vacationRequest.subtitle}
          </p>
        </div>

        <div 
          className="card"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '1rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
            padding: '2.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {submitStatus === 'success' ? (
            <div className="text-center">
              <div 
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ 
                  width: '4rem', 
                  height: '4rem', 
                  backgroundColor: '#dcfce7', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem auto' 
                }}
              >
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 
                className="text-2xl font-semibold mb-4 text-gray-900"
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '1rem' 
                }}
              >
                {t.vacationRequest.success}
              </h2>
              <Link 
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                style={{ 
                  display: 'inline-block',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {t.common.back}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label 
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ 
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {t.vacationRequest.startDate} *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ 
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ 
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {t.vacationRequest.endDate} *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ 
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label 
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ 
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {t.vacationRequest.company} *
                  </label>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ 
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      outline: 'none'
                    }}
                  >
                    <option value="">{t.common.loading}</option>
                    <option value="STARS_MC">{t.companies.STARS_MC}</option>
                    <option value="STARS_YACHTING">{t.companies.STARS_YACHTING}</option>
                    <option value="STARS_REAL_ESTATE">{t.companies.STARS_REAL_ESTATE}</option>
                    <option value="LE_PNEU">{t.companies.LE_PNEU}</option>
                    <option value="MIDI_PNEU">{t.companies.MIDI_PNEU}</option>
                    <option value="STARS_AVIATION">{t.companies.STARS_AVIATION}</option>
                  </select>
                </div>

                <div>
                  <label 
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-2"
                    style={{ 
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {t.vacationRequest.type} *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    style={{ 
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      outline: 'none'
                    }}
                  >
                    <option value="">{t.common.loading}</option>
                    <option value="VACATION">{t.vacationTypes.VACATION}</option>
                    <option value="SICK_LEAVE">{t.vacationTypes.SICK_LEAVE}</option>
                    <option value="PERSONAL_DAY">{t.vacationTypes.PERSONAL_DAY}</option>
                    <option value="OTHER">{t.vacationTypes.OTHER}</option>
                  </select>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ 
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}
                >
                  {t.vacationRequest.reason}
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={t.vacationRequest.reasonPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  style={{ 
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {submitStatus === 'error' && (
                <div 
                  className="bg-red-50 border border-red-200 rounded-md p-4"
                  style={{ 
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.375rem',
                    padding: '1rem'
                  }}
                >
                  <p 
                    className="text-red-800"
                    style={{ color: '#991b1b' }}
                  >
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Link 
                  href="/dashboard"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  style={{ 
                    padding: '0.5rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    textDecoration: 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {t.common.cancel}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !validateForm()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  style={{ 
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: isSubmitting || !validateForm() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !validateForm() ? 0.5 : 1,
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {isSubmitting ? t.vacationRequest.submitting : t.vacationRequest.submit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
} 