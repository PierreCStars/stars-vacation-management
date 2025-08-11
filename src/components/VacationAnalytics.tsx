'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VacationAnalytics {
  totalVacations: number;
  totalDays: number;
  byPerson: VacationDetail[];
  byCompany: CompanyAnalytics[];
  byType: TypeAnalytics[];
}

interface VacationDetail {
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

interface CompanyAnalytics {
  company: string;
  totalVacations: number;
  totalDays: number;
  employees: string[];
}

interface TypeAnalytics {
  type: string;
  totalVacations: number;
  totalDays: number;
  employees: string[];
}

export default function VacationAnalytics() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'summary' | 'byPerson' | 'byCompany' | 'byType'>('summary');
  const [analytics, setAnalytics] = useState<VacationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/vacation-analytics';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'summary', label: '📊 Summary', icon: '📊' },
    { id: 'byPerson', label: '👥 By Person', icon: '👥' },
    { id: 'byCompany', label: '🏢 By Company', icon: '🏢' },
    { id: 'byType', label: '🏖️ By Type', icon: '🏖️' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">Error loading analytics: {error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Show message if no approved vacations
  if (analytics.totalVacations === 0) {
    return (
      <div className="space-y-6">
        {/* Date Filter */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📅 Date Range Filter</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* No Data Message */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Vacation Data Available</h2>
          <p className="text-gray-600 mb-6">
            There are currently no approved vacation requests in the system.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>Tip:</strong> Vacation analytics will appear here once employees submit and admins approve vacation requests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">📅 Date Range Filter</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Filter
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">📊 Analytics Summary</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{analytics.totalVacations}</div>
                <div className="text-blue-800 font-medium">Total Vacations</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{analytics.totalDays}</div>
                <div className="text-green-800 font-medium">Total Days</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">{analytics.byPerson.length}</div>
                <div className="text-purple-800 font-medium">Employees</div>
              </div>
            </div>

            {/* Top Performers */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🏆 Top Vacation Takers</h3>
              <div className="space-y-3">
                {analytics.byPerson.slice(0, 5).map((person, index) => (
                  <div key={person.userId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}</span>
                      <div>
                        <div className="font-medium">{person.userName}</div>
                        <div className="text-sm text-gray-600">{person.userEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{person.totalDays} days</div>
                      <div className="text-sm text-gray-600">{person.totalVacations} vacations</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'byPerson' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">👥 Vacation Analytics by Person</h2>
            
            <div className="space-y-4">
              {analytics.byPerson.map((person) => (
                <div key={person.userId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{person.userName}</h3>
                      <p className="text-gray-600">{person.userEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{person.totalDays}</div>
                      <div className="text-gray-600">total days</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Vacation Details</h4>
                      <div className="space-y-2">
                        {person.vacations.map((vacation) => (
                          <div key={vacation.id} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>{new Date(vacation.startDate).toLocaleDateString()} - {new Date(vacation.endDate).toLocaleDateString()}</span>
                              <span className="font-medium">{vacation.days} days</span>
                            </div>
                            <div className="text-gray-600">{vacation.company} • {vacation.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Vacations:</span>
                          <span className="font-medium">{person.totalVacations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Days:</span>
                          <span className="font-medium">{person.totalDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average per Vacation:</span>
                          <span className="font-medium">
                            {person.totalVacations > 0 ? Math.round(person.totalDays / person.totalVacations * 10) / 10 : 0} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'byCompany' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">🏢 Vacation Analytics by Company</h2>
            
            <div className="space-y-4">
              {analytics.byCompany.map((company) => (
                <div key={company.company} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{company.company}</h3>
                      <p className="text-gray-600">{company.employees.length} employees</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{company.totalDays}</div>
                      <div className="text-gray-600">total days</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Employees</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.employees.map((employee) => (
                          <span key={employee} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {employee}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Vacations:</span>
                          <span className="font-medium">{company.totalVacations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Days:</span>
                          <span className="font-medium">{company.totalDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average per Employee:</span>
                          <span className="font-medium">
                            {company.employees.length > 0 ? Math.round(company.totalDays / company.employees.length * 10) / 10 : 0} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'byType' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">🏖️ Vacation Analytics by Type</h2>
            
            <div className="space-y-4">
              {analytics.byType.map((type) => (
                <div key={type.type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{type.type}</h3>
                      <p className="text-gray-600">{type.employees.length} employees</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{type.totalDays}</div>
                      <div className="text-gray-600">total days</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Employees</h4>
                      <div className="flex flex-wrap gap-2">
                        {type.employees.map((employee) => (
                          <span key={employee} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            {employee}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Vacations:</span>
                          <span className="font-medium">{type.totalVacations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Days:</span>
                          <span className="font-medium">{type.totalDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average per Vacation:</span>
                          <span className="font-medium">
                            {type.totalVacations > 0 ? Math.round(type.totalDays / type.totalVacations * 10) / 10 : 0} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
