import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase-config';

const VacationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVacationRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query the vacationRequests collection (camelCase)
        const vacationRequestsRef = collection(db, 'vacationRequests');
        const q = query(vacationRequestsRef, orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const requestsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequests(requestsList);
        console.log('Fetched vacation requests:', requestsList);
      } catch (err) {
        console.error('Error fetching vacation requests:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVacationRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading vacation requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        <br />
        <small>Check the browser console for more details.</small>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-lg text-gray-600">No vacation requests found.</div>
        <div className="text-sm text-gray-500 mt-2">
          Make sure the 'vacationRequests' collection exists in your Firestore database.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Vacation Requests ({requests.length})</h2>
      
      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">
                {request.userName || 'Unknown Employee'}
              </h3>
              <span className={`px-2 py-1 rounded text-sm ${
                request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status || 'PENDING'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <strong>Start Date:</strong> {request.startDate || 'Not specified'}
              </div>
              <div>
                <strong>End Date:</strong> {request.endDate || 'Not specified'}
              </div>
              <div>
                <strong>Type:</strong> {request.type || 'Not specified'}
              </div>
              <div>
                <strong>Request Date:</strong> {request.createdAt ? 
                  new Date(request.createdAt.seconds * 1000).toLocaleDateString() : 
                  'Not specified'
                }
              </div>
              <div>
                <strong>Employee Email:</strong> {request.userEmail || 'Not specified'}
              </div>
              <div>
                <strong>Reviewed By:</strong> {request.reviewedBy || 'Not reviewed'}
              </div>
            </div>
            
            {request.reason && (
              <div className="mt-2">
                <strong>Reason:</strong>
                <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
              </div>
            )}
            
            {request.reviewedAt && (
              <div className="mt-2">
                <strong>Reviewed At:</strong>
                <span className="text-sm text-gray-600 ml-1">
                  {new Date(request.reviewedAt.seconds * 1000).toLocaleString()}
                </span>
              </div>
            )}
            
            {request.googleCalendarEventId && (
              <div className="mt-2">
                <strong>Calendar Event:</strong>
                <span className="text-sm text-blue-600 ml-1">
                  {request.googleCalendarEventId}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VacationRequests;
