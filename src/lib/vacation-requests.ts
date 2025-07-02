import { promises as fs } from 'fs';
import path from 'path';

// File path for storing vacation requests
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'vacation-requests.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load vacation requests from file
export async function loadVacationRequests(): Promise<any[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

// Save vacation requests to file
export async function saveVacationRequests(requests: any[]) {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(requests, null, 2));
}

// Export function to get all vacation requests (for admin pages)
export async function getAllVacationRequests() {
  return await loadVacationRequests();
}

// Export function to update vacation request status
export async function updateVacationRequestStatus(id: string, status: string, comment?: string, reviewerName?: string, reviewerEmail?: string) {
  const vacationRequests = await loadVacationRequests();
  const requestIndex = vacationRequests.findIndex(req => req.id === id);
  
  if (requestIndex !== -1) {
    vacationRequests[requestIndex].status = status;
    if (comment) {
      vacationRequests[requestIndex].adminComment = comment;
    }
    // Add reviewer information when status is changed to APPROVED or REJECTED
    if (status === 'APPROVED' || status === 'REJECTED') {
      vacationRequests[requestIndex].reviewedBy = reviewerName || 'Unknown';
      vacationRequests[requestIndex].reviewerEmail = reviewerEmail || '';
      vacationRequests[requestIndex].reviewedAt = new Date().toISOString();
    }
    await saveVacationRequests(vacationRequests);
    return vacationRequests[requestIndex];
  }
  
  return null;
}