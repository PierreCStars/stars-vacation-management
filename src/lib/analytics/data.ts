/**
 * Analytics Data Access Module
 * 
 * This module provides server-side functions to fetch analytics data from Firebase Admin.
 * All analytics pages and API routes should import from this module only.
 * 
 * Runtime: Node.js only (server-side)
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationStatus, normalizeVacationType } from '@/lib/normalize-vacation-fields';
import { calculateVacationDuration, sumDurations } from '@/lib/duration-calculator';

export interface VacationRequest {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  company?: string;
  type?: string;
  status?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  reason?: string;
  createdAt?: any;
  updatedAt?: any;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: any;
  adminComment?: string;
  googleEventId?: string;
}

export interface EmployeeAnalytics {
  userId?: string;
  userEmail?: string;
  userName: string;
  company: string;
  totalDays: number;
  count: number;
  avg: number;
  lastRequestDate?: string;
  firstRequestDate?: string;
}

export interface TypeAnalytics {
  type: string;
  count: number;
  totalDays: number;
  employees: string[];
}

export interface CompanyAnalytics {
  company: string;
  totalRequests: number;
  totalDays: number;
  employees: string[];
}

export interface VacationAnalytics {
  totalVacations: number;
  totalDays: number;
  byPerson: EmployeeAnalytics[];
  byCompany: CompanyAnalytics[];
  byType: TypeAnalytics[];
}

/**
 * Get all vacation requests from Firebase
 */
export async function getVacationRequests(status?: string): Promise<VacationRequest[]> {
  console.info('[ANALYTICS] source=firebase query=getVacationRequests', { status });

  const { db, error } = getFirebaseAdmin();
  
  if (!db || error) {
    console.error('❌ Firebase Admin not available:', error);
    throw new Error('Firebase Admin not available');
  }

  console.log('🔍 Debug: Firebase Admin is available, getting Firestore instance');
  const collection = db.collection('vacationRequests');

  let snapshot;
  try {
    if (status && status !== 'all') {
      // Normalize the requested status to canonical value
      const canonicalStatus = normalizeVacationStatus(status);
      
      // Query for all possible variations of the status (legacy support)
      // Since Firestore doesn't support OR queries easily, we'll fetch all and filter
      console.log('🔍 Debug: Querying all documents (will filter by normalized status)');
      snapshot = await collection.get();
    } else {
      console.log('🔍 Debug: Querying all documents');
      snapshot = await collection.get();
    }
    console.log('🔍 Debug: Query completed, got', snapshot.docs.length, 'documents');
  } catch (queryError) {
    console.error('❌ Error querying Firestore:', queryError);
    throw queryError;
  }

  // Map and normalize requests
  let requests: VacationRequest[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Normalize status and type to canonical values
      status: normalizeVacationStatus(data.status),
      type: normalizeVacationType(data.type || 'Other'),
    } as VacationRequest;
  });

  // Filter by normalized status if requested
  if (status && status !== 'all') {
    const canonicalStatus = normalizeVacationStatus(status);
    requests = requests.filter(r => normalizeVacationStatus(r.status) === canonicalStatus);
  }

  console.info('[ANALYTICS] source=firebase result=success', {
    count: requests.length,
    status: status || 'all'
  });

  return requests;
}

/**
 * Get vacation analytics data
 */
export async function getVacationAnalytics(status?: string): Promise<VacationAnalytics> {
  console.info('[ANALYTICS] source=firebase query=getVacationAnalytics', { status });
  
  const requests = await getVacationRequests(status);
  
  // Process data
  const byPersonMap = new Map<string, EmployeeAnalytics>();
  const byTypeMap = new Map<string, TypeAnalytics>();
  const byCompanyMap = new Map<string, CompanyAnalytics>();

  let totalDays = 0;

  for (const request of requests) {
    const days = calculateDuration(request);
    totalDays += days;

    // Employee analytics
    const empKey = request.userEmail || request.userId || request.userName || request.id;
    const name = request.userName || 'Unknown';
    const company = request.company || '—';
    // Normalize vacation types to canonical value
    let type = request.type || (request.isHalfDay ? 'Half day' : 'Full day');
    type = normalizeVacationType(type);

    if (!byPersonMap.has(empKey)) {
      byPersonMap.set(empKey, {
        userId: request.userId,
        userEmail: request.userEmail,
        userName: name,
        company,
        totalDays: 0,
        count: 0,
        avg: 0,
        lastRequestDate: request.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        firstRequestDate: request.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    }

    const emp = byPersonMap.get(empKey)!;
    emp.totalDays += days;
    emp.count += 1;
    emp.avg = emp.totalDays / emp.count;

    // Type analytics
    if (!byTypeMap.has(type)) {
      byTypeMap.set(type, { type, count: 0, totalDays: 0, employees: [] });
    }
    const typeData = byTypeMap.get(type)!;
    typeData.count += 1;
    typeData.totalDays += days;
    if (!typeData.employees.includes(name)) {
      typeData.employees.push(name);
    }

    // Company analytics
    if (!byCompanyMap.has(company)) {
      byCompanyMap.set(company, { company, totalRequests: 0, totalDays: 0, employees: [] });
    }
    const companyData = byCompanyMap.get(company)!;
    companyData.totalRequests += 1;
    companyData.totalDays += days;
    if (!companyData.employees.includes(name)) {
      companyData.employees.push(name);
    }
  }

  const byPerson = Array.from(byPersonMap.values()).sort((a, b) => b.totalDays - a.totalDays);
  const byType = Array.from(byTypeMap.values()).sort((a, b) => b.count - a.count);
  const byCompany = Array.from(byCompanyMap.values()).sort((a, b) => b.totalDays - a.totalDays);

  console.info('[ANALYTICS] source=firebase result=success', {
    totalVacations: requests.length,
    totalDays,
    byPersonCount: byPerson.length,
    byTypeCount: byType.length,
    byCompanyCount: byCompany.length
  });

  return {
    totalVacations: requests.length,
    totalDays,
    byPerson,
    byCompany,
    byType
  };
}

/**
 * Get requests by status
 */
export async function getRequestsByStatus(status: string): Promise<VacationRequest[]> {
  return getVacationRequests(status);
}

/**
 * Get top employees by days taken
 */
export async function getTopEmployeesByDays(limit: number = 10): Promise<EmployeeAnalytics[]> {
  const analytics = await getVacationAnalytics();
  return analytics.byPerson.slice(0, limit);
}

/**
 * Calculate duration of a vacation request
 */
function calculateDuration(request: VacationRequest): number {
  if (typeof request.durationDays === 'number') {
    return request.durationDays;
  }
  
  if (request.isHalfDay) {
    return 0.5;
  }
  
  if (request.startDate && request.endDate) {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  
  return 0;
}

/**
 * Get analytics source information for debugging
 */
export async function getAnalyticsSourceInfo(): Promise<{
  source: 'firestore';
  firebaseAvailable: boolean;
  totalRequests: number;
  sampleIds: string[];
}> {
  console.info('[ANALYTICS] source=firebase query=getAnalyticsSourceInfo');

  const { db, error } = getFirebaseAdmin();
  const firebaseAvailable = !error && !!db;
  let totalRequests = 0;
  let sampleIds: string[] = [];

  if (firebaseAvailable) {
    try {
      const requests = await getVacationRequests();
      totalRequests = requests.length;
      sampleIds = requests.slice(0, 5).map(r => r.id);
    } catch (error) {
      console.error('[ANALYTICS] source=firebase error=failed to fetch data', error);
    }
  }

  return {
    source: 'firestore',
    firebaseAvailable,
    totalRequests,
    sampleIds
  };
}
