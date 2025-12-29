'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import CreateVacationModal from '@/components/admin/CreateVacationModal';

export default function AdminSetupClient() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingMonthlyEmail, setIsSendingMonthlyEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const { data: session } = useSession();
  const t = useTranslations('admin');
  const tSetup = useTranslations('admin.setup');
  const tCommon = useTranslations('common');

  const handleVacationCreated = () => {
    setActionMessage({
      type: 'success',
      message: 'Vacation created and validated successfully!'
    });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleSyncToCalendar = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/sync/approved-requests', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        setActionMessage({
          type: 'error',
          message: `Sync completed with ${data.synced || 0} successful, but ${data.errors.length} request(s) failed to sync. Check console for details.`
        });
      } else {
        setActionMessage({
          type: 'success',
          message: `Sync completed successfully! ${data.synced || 0} request(s) synced to calendar.`
        });
      }
      
      setTimeout(() => setActionMessage(null), 5000);
      
    } catch (error) {
      console.error('Sync error:', error);
      setActionMessage({
        type: 'error',
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendMonthlyEmail = async () => {
    if (isSendingMonthlyEmail) return;
    
    setIsSendingMonthlyEmail(true);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/cron/monthly-vacation-summary', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to send email: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📧 Monthly email API response:', {
        ok: data.ok,
        emailSent: data.emailSent,
        isTestService: data.isTestService,
        emailError: data.emailError,
        validated: data.validated,
        recipients: data.recipients
      });
      
      if (data.ok && data.emailSent) {
        const recipients = data.recipients || data.recipient || ['compta@stars.mc', 'pierre@stars.mc'];
        const recipientList = Array.isArray(recipients) ? recipients.join(', ') : recipients;
        setActionMessage({
          type: 'success',
          message: `Monthly summary email sent successfully to ${recipientList}! (${data.validated || 0} validated vacations)`
        });
      } else if (data.ok && data.isTestService) {
        // Email was sent via test service (Ethereal) - warn user
        const recipients = data.recipients || data.recipient || ['compta@stars.mc', 'pierre@stars.mc'];
        const recipientList = Array.isArray(recipients) ? recipients.join(', ') : recipients;
        setActionMessage({
          type: 'error',
          message: `⚠️ Email sent via TEST SERVICE only. Real emails were NOT delivered to ${recipientList}. All email services failed. Please check email configuration (SMTP, Resend, or Gmail).`
        });
        console.error('Email sent via test service:', {
          warning: data.emailWarning,
          provider: data.emailProvider,
          recipients: data.recipients,
          previewUrl: data.previewUrl
        });
      } else {
        // Email sending failed - show detailed error
        const errorMsg = data.emailError || data.error || 'Email sending failed';
        
        // Build actionable error message
        let actionableMessage = `Email sending failed: ${errorMsg}`;
        
        if (data.emailConfigurationMissing) {
          actionableMessage += '\n\n❌ No email providers configured in production.';
          
          // Add configuration help if available
          if (data.emailConfigurationHelp) {
            actionableMessage += '\n\nPlease configure at least one provider in Vercel:';
            const options = data.emailConfigurationHelp.options || [];
            options.forEach((opt: any) => {
              actionableMessage += `\n• ${opt.provider}: ${opt.required.join(', ')}`;
            });
            actionableMessage += '\n\nSee README.md for detailed setup instructions.';
          } else {
            actionableMessage += '\n\nPlease configure SMTP, Resend, or Gmail credentials in Vercel environment variables.';
          }
        } else {
          // Show service-specific errors
          const allErrors: string[] = [];
          
          if (data.emailServiceErrors && Array.isArray(data.emailServiceErrors) && data.emailServiceErrors.length > 0) {
            allErrors.push(...data.emailServiceErrors.map((e: any) => `${e.service}: ${e.error}`));
          }
          
          if (data.emailSkippedServices && Array.isArray(data.emailSkippedServices) && data.emailSkippedServices.length > 0) {
            allErrors.push(...data.emailSkippedServices.map((s: any) => `${s.service}: ${s.reason}`));
          }
          
          if (allErrors.length > 0) {
            actionableMessage += `\n\nIssues:\n${allErrors.map(e => `• ${e}`).join('\n')}`;
          } else {
            actionableMessage += '\n\nCheck email service configuration (SMTP, Resend, or Gmail).';
          }
        }
        
        setActionMessage({
          type: 'error',
          message: actionableMessage
        });
        
        // Log clean error information (avoid dumping prototype chains)
        const cleanErrorInfo = {
          error: data.emailError || data.error,
          provider: data.emailProvider,
          recipients: Array.isArray(data.recipients) ? data.recipients : [data.recipients],
          validated: data.validated,
          serviceErrors: data.emailServiceErrors || [],
          skippedServices: data.emailSkippedServices || [],
          configurationMissing: data.emailConfigurationMissing,
          configurationHelp: data.emailConfigurationHelp
        };
        console.error('Email sending failed:', cleanErrorInfo);
        
        // Also log configuration help to console for easy copy-paste
        if (data.emailConfigurationHelp) {
          console.error('\n📧 Email Configuration Required:');
          console.error('Add these environment variables in Vercel:');
          const options = data.emailConfigurationHelp.options || [];
          options.forEach((opt: any) => {
            console.error(`\n${opt.provider}:`);
            opt.required.forEach((varName: string) => {
              console.error(`  - ${varName}`);
            });
          });
        }
      }
      
      setTimeout(() => setActionMessage(null), 5000);
      
    } catch (error) {
      console.error('Send monthly email error:', error);
      setActionMessage({
        type: 'error',
        message: `Failed to send monthly email: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setIsSendingMonthlyEmail(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{tSetup('title')}</h1>
        <p className="mt-2 text-sm text-gray-600">{tSetup('description')}</p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`mb-6 rounded-lg p-4 ${
          actionMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {actionMessage.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                actionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {actionMessage.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Vacation Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{tSetup('createVacation.title')}</h3>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">{tSetup('createVacation.description')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {tSetup('createVacation.button')}
          </button>
        </div>

        {/* Sync Calendar Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{tSetup('syncCalendar.title')}</h3>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">{tSetup('syncCalendar.description')}</p>
          <button
            onClick={handleSyncToCalendar}
            disabled={isSyncing}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {tSetup('syncCalendar.syncing')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {tSetup('syncCalendar.button')}
              </>
            )}
          </button>
        </div>

        {/* Send Monthly Email Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{tSetup('sendEmail.title')}</h3>
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">{tSetup('sendEmail.description')}</p>
          <button
            onClick={handleSendMonthlyEmail}
            disabled={isSendingMonthlyEmail}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingMonthlyEmail ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {tSetup('sendEmail.sending')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {tSetup('sendEmail.button')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Create Vacation Modal */}
      <CreateVacationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleVacationCreated}
      />
    </div>
  );
}

