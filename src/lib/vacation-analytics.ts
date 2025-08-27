import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface VacationAnalytics {
  totalVacations: number;
  totalDays: number;
  byPerson: VacationDetail[];
  byCompany: CompanyAnalytics[];
  byType: TypeAnalytics[];
}

export interface VacationDetail {
  userId: string;
  userEmail: string;
  userName: string;
  totalVacations: number;
  totalDays: number;
  vacations: {
    id: string;
    startDate: string;
    endDate: string;
    company: string;
    type: string;
    days: number;
  }[];
}

export interface CompanyAnalytics {
  company: string;
  totalVacations: number;
  totalDays: number;
  employees: string[];
}

export interface TypeAnalytics {
  type: string;
  totalVacations: number;
  totalDays: number;
  employees: string[];
}

export async function getVacationAnalytics(): Promise<VacationAnalytics> {
  try {
    // Check if Firebase is available
    if (!db) {
      console.error('Firebase database not available');
      return {
        totalVacations: 0,
        totalDays: 0,
        byPerson: [],
        byCompany: [],
        byType: []
      };
    }

    // Import and ensure Firebase auth is initialized
    const { initializeFirebaseAuth } = await import('./firebase');
    await initializeFirebaseAuth();

    console.log('🔍 Fetching all approved vacation requests for analytics...');
    
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const q = query(
      vacationRequestsRef,
      where('status', '==', 'APPROVED')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`📊 Found ${querySnapshot.docs.length} approved vacation requests`);
    
    // Log all the data to debug
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 Request ${index + 1}: ${doc.id} - ${data.userName} (${data.userEmail}) - ${data.company} - ${data.type} - Status: ${data.status}`);
    });
    
    const approvedRequests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }) as any[];

    // Sort in memory to avoid Firestore index requirements
    approvedRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const result = processVacationData(approvedRequests);
    console.log(`✅ Analytics processed: ${result.totalVacations} vacations, ${result.totalDays} days, ${result.byPerson.length} people`);
    
    return result;
  } catch (error) {
    console.error('Error fetching vacation analytics:', error);
    
    // Return empty analytics instead of throwing error
    return {
      totalVacations: 0,
      totalDays: 0,
      byPerson: [],
      byCompany: [],
      byType: []
    };
  }
}

export async function getVacationAnalyticsForPeriod(startDate: string, endDate: string): Promise<VacationAnalytics> {
  try {
    // Check if Firebase is available
    if (!db) {
      console.error('Firebase database not available');
      return {
        totalVacations: 0,
        totalDays: 0,
        byPerson: [],
        byCompany: [],
        byType: []
      };
    }

    // Get all approved requests and filter in memory to avoid complex Firestore queries
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const q = query(
      vacationRequestsRef,
      where('status', '==', 'APPROVED')
    );
    
    const querySnapshot = await getDocs(q);
    const allApprovedRequests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Filter by date range in memory
    const filteredRequests = allApprovedRequests.filter(request => {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      // Check if the vacation overlaps with the filter period
      return requestStart <= filterEnd && requestEnd >= filterStart;
    });

    return processVacationData(filteredRequests);
  } catch (error) {
    console.error('Error fetching vacation analytics for period:', error);
    
    // Return empty analytics instead of throwing error
    return {
      totalVacations: 0,
      totalDays: 0,
      byPerson: [],
      byCompany: [],
      byType: []
    };
  }
}

function processVacationData(requests: any[]): VacationAnalytics {
  // Group by person
  const byPersonMap = new Map<string, VacationDetail>();
  
  requests.forEach(request => {
    const days = calculateVacationDays(request.startDate, request.endDate);
    
    if (!byPersonMap.has(request.userId)) {
      byPersonMap.set(request.userId, {
        userId: request.userId,
        userEmail: request.userEmail,
        userName: request.userName,
        totalVacations: 0,
        totalDays: 0,
        vacations: []
      });
    }
    
    const person = byPersonMap.get(request.userId)!;
    person.totalVacations++;
    person.totalDays += days;
    person.vacations.push({
      id: request.id,
      startDate: request.startDate,
      endDate: request.endDate,
      company: request.company,
      type: request.type,
      days
    });
  });

  // Group by company
  const byCompanyMap = new Map<string, CompanyAnalytics>();
  
  requests.forEach(request => {
    const days = calculateVacationDays(request.startDate, request.endDate);
    
    if (!byCompanyMap.has(request.company)) {
      byCompanyMap.set(request.company, {
        company: request.company,
        totalVacations: 0,
        totalDays: 0,
        employees: []
      });
    }
    
    const company = byCompanyMap.get(request.company)!;
    company.totalVacations++;
    company.totalDays += days;
    if (!company.employees.includes(request.userName)) {
      company.employees.push(request.userName);
    }
  });

  // Group by type
  const byTypeMap = new Map<string, TypeAnalytics>();
  
  requests.forEach(request => {
    const days = calculateVacationDays(request.startDate, request.endDate);
    
    if (!byTypeMap.has(request.type)) {
      byTypeMap.set(request.type, {
        type: request.type,
        totalVacations: 0,
        totalDays: 0,
        employees: []
      });
    }
    
    const type = byTypeMap.get(request.type)!;
    type.totalVacations++;
    type.totalDays += days;
    if (!type.employees.includes(request.userName)) {
      type.employees.push(request.userName);
    }
  });

  const totalDays = Array.from(byPersonMap.values()).reduce((sum, person) => sum + person.totalDays, 0);

  return {
    totalVacations: requests.length,
    totalDays,
    byPerson: Array.from(byPersonMap.values()).sort((a, b) => b.totalDays - a.totalDays),
    byCompany: Array.from(byCompanyMap.values()).sort((a, b) => b.totalDays - a.totalDays),
    byType: Array.from(byTypeMap.values()).sort((a, b) => b.totalDays - a.totalDays)
  };
}

export function calculateVacationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let days = 0;
  const current = new Date(start);
  
  while (current <= end) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
