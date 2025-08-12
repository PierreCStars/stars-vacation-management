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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  // Set default date range to show previous months
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Default to showing last 6 months
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
    setSelectedPeriod('custom');
  }, []);

  const handlePeriodChange = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (period) {
      case 'last3months':
        const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
        setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      case 'last6months':
        const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
        setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      case 'lastYear':
        const lastYear = new Date(currentYear - 1, 0, 1);
        setStartDate(lastYear.toISOString().split('T')[0]);
        setEndDate(new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]);
        break;
      case 'thisYear':
        const thisYear = new Date(currentYear, 0, 1);
        setStartDate(thisYear.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      case 'custom':
        // Keep current custom dates
        break;
    }
    setSelectedPeriod(period);
  };

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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">📊 Historical Vacation Analytics</h1>
            <p className="text-blue-100 text-lg">Comprehensive insights into your team's vacation patterns over time</p>
          </div>
        </div>

        {/* Date Filter */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-2xl mr-3">📅</span>
              Historical Vacation Analytics
            </h3>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedPeriod('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <span className="mr-2">🔄</span>
              Show All Time
            </button>
          </div>
          
          {/* Quick Period Selectors */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Periods:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePeriodChange('last3months')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === 'last3months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Last 3 Months
              </button>
              <button
                onClick={() => handlePeriodChange('last6months')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === 'last6months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                📅 Last 6 Months
              </button>
              <button
                onClick={() => handlePeriodChange('lastYear')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === 'lastYear'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Last Year
              </button>
              <button
                onClick={() => handlePeriodChange('thisYear')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === 'thisYear'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                📅 This Year
              </button>
              <button
                onClick={() => handlePeriodChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 All Time
              </button>
            </div>
          </div>
          
          {/* Custom Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Custom Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPeriod('custom');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Custom End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPeriod('custom');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg w-full">
                <div className="font-medium">Current Period:</div>
                <div>{startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* No Data Message */}
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Vacation Data Available</h2>
          <p className="text-gray-600 mb-6 text-lg">
            There are currently no approved vacation requests in the system.
          </p>
          <div className="bg-blue-50 p-6 max-w-2xl mx-auto">
            <p className="text-blue-800 text-lg">
              <strong>💡 Tip:</strong> Vacation analytics will appear here once employees submit and admins approve vacation requests.
            </p>
            <div className="mt-4 text-sm text-blue-600">
              <p>• Submit vacation requests through the main form</p>
              <p>• Admins can approve requests in the Vacation Requests tab</p>
              <p>• Analytics will automatically populate with real data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Historical Vacation Analytics</h1>
            <p className="text-blue-100 text-lg">Comprehensive insights into your team's vacation patterns over time</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{analytics.totalVacations}</div>
            <div className="text-blue-100">Total Vacations</div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{analytics.totalDays}</div>
            <div className="text-blue-100 text-sm">Total Days</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{analytics.byPerson.length}</div>
            <div className="text-blue-100 text-sm">Employees</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{analytics.byCompany.length}</div>
            <div className="text-blue-100 text-sm">Companies</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{analytics.byType.length}</div>
            <div className="text-blue-100 text-sm">Vacation Types</div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-3">📅</span>
            Historical Vacation Analytics
          </h3>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedPeriod('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
          >
            <span className="mr-2">🔄</span>
            Show All Time
          </button>
        </div>
        
        {/* Quick Period Selectors */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Periods:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePeriodChange('last3months')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'last3months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Last 3 Months
            </button>
            <button
              onClick={() => handlePeriodChange('last6months')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'last6months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              📅 Last 6 Months
            </button>
            <button
              onClick={() => handlePeriodChange('lastYear')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'lastYear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Last Year
            </button>
            <button
              onClick={() => handlePeriodChange('thisYear')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'thisYear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              📅 This Year
            </button>
            <button
              onClick={() => handlePeriodChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 All Time
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Custom Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedPeriod('custom');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Custom End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedPeriod('custom');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg w-full">
              <div className="font-medium">Current Period:</div>
              <div>{startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-8 mx-2 text-center font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden">
        {activeTab === 'summary' && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Analytics Summary</h2>
              <p className="text-gray-600">Overview of vacation patterns and key metrics</p>
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold text-blue-600 mb-2">{analytics.totalVacations}</div>
                <div className="text-blue-800 font-semibold">Total Vacations</div>
                <div className="text-blue-600 text-sm mt-1">Approved requests</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold text-green-600 mb-2">{analytics.totalDays}</div>
                <div className="text-green-800 font-semibold">Total Days</div>
                <div className="text-green-600 text-sm mt-1">Business days</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold text-purple-600 mb-2">{analytics.byPerson.length}</div>
                <div className="text-purple-800 font-semibold">Employees</div>
                <div className="text-purple-600 text-sm mt-1">With vacations</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {analytics.totalVacations > 0 ? Math.round(analytics.totalDays / analytics.totalVacations * 10) / 10 : 0}
                </div>
                <div className="text-orange-800 font-semibold">Avg Days</div>
                <div className="text-orange-600 text-sm mt-1">Per vacation</div>
              </div>
            </div>

            {/* Top Performers Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🏆</span>
                Top Vacation Takers
              </h3>
              <div className="space-y-4">
                {analytics.byPerson.slice(0, 5).map((person, index) => (
                  <div key={person.userId} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{person.userName}</div>
                          <div className="text-gray-600 text-sm">{person.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{person.totalDays}</div>
                        <div className="text-gray-600">days</div>
                        <div className="text-sm text-gray-500">{person.totalVacations} vacations</div>
                      </div>
                    </div>
                  </div>
                ))}
                {analytics.byPerson.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <div>No vacation data available yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'byPerson' && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">👥 Vacation Analytics by Person</h2>
              <p className="text-gray-600">Detailed breakdown of vacation patterns for each employee</p>
            </div>
            
            <div className="space-y-6">
              {analytics.byPerson.map((person, index) => (
                <div key={person.userId} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Person Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {person.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{person.userName}</h3>
                        <p className="text-gray-600">{person.userEmail}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            #{index + 1} Rank
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {person.totalVacations} vacations
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-blue-600">{person.totalDays}</div>
                      <div className="text-gray-600 text-lg">total days</div>
                      <div className="text-sm text-gray-500">
                        Avg: {person.totalVacations > 0 ? Math.round(person.totalDays / person.totalVacations * 10) / 10 : 0} days/vacation
                      </div>
                    </div>
                  </div>
                  
                  {/* Vacation Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">📅</span>
                        Vacation Details
                      </h4>
                      <div className="space-y-3">
                        {person.vacations.map((vacation) => (
                          <div key={vacation.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm text-gray-600">
                                {new Date(vacation.startDate).toLocaleDateString()} - {new Date(vacation.endDate).toLocaleDateString()}
                              </div>
                              <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold">
                                {vacation.days} days
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg">
                                🏢 {vacation.company}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg">
                                🏖️ {vacation.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">📊</span>
                        Statistics
                      </h4>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Vacations:</span>
                            <span className="text-2xl font-bold text-blue-600">{person.totalVacations}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Days:</span>
                            <span className="text-2xl font-bold text-green-600">{person.totalDays}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Average per Vacation:</span>
                            <span className="text-2xl font-bold text-purple-600">
                              {person.totalVacations > 0 ? Math.round(person.totalDays / person.totalVacations * 10) / 10 : 0} days
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {analytics.byPerson.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-xl">No employee vacation data available</div>
                  <div className="text-sm mt-2">Employee analytics will appear here once vacations are approved</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'byCompany' && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🏢 Vacation Analytics by Company</h2>
              <p className="text-gray-600">Company-wide vacation patterns and employee distribution</p>
            </div>
            
            <div className="space-y-6">
              {analytics.byCompany.map((company, index) => (
                <div key={company.company} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Company Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        🏢
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{company.company}</h3>
                        <p className="text-gray-600">{company.employees.length} employees</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            #{index + 1} Company
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {company.totalVacations} vacations
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-green-600">{company.totalDays}</div>
                      <div className="text-gray-600 text-lg">total days</div>
                      <div className="text-sm text-gray-500">
                        Avg: {company.employees.length > 0 ? Math.round(company.totalDays / company.employees.length * 10) / 10 : 0} days/employee
                      </div>
                    </div>
                  </div>
                  
                  {/* Company Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">👥</span>
                        Employees
                      </h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex flex-wrap gap-2">
                          {company.employees.map((employee) => (
                            <span key={employee} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200">
                              👤 {employee}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">📊</span>
                        Company Statistics
                      </h4>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Vacations:</span>
                            <span className="text-2xl font-bold text-green-600">{company.totalVacations}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Days:</span>
                            <span className="text-2xl font-bold text-blue-600">{company.totalDays}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Average per Employee:</span>
                            <span className="text-2xl font-bold text-purple-600">
                              {company.employees.length > 0 ? Math.round(company.totalDays / company.employees.length * 10) / 10 : 0} days
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {analytics.byCompany.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🏢</div>
                  <div className="text-xl">No company vacation data available</div>
                  <div className="text-sm mt-2">Company analytics will appear here once vacations are approved</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'byType' && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🏖️ Vacation Analytics by Type</h2>
              <p className="text-gray-600">Breakdown of vacation patterns by type and category</p>
            </div>
            
            <div className="space-y-6">
              {analytics.byType.map((type, index) => (
                <div key={type.type} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Type Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        🏖️
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{type.type}</h3>
                        <p className="text-gray-600">{type.employees.length} employees</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            #{index + 1} Type
                          </span>
                          <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                            {type.totalVacations} vacations
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-purple-600">{type.totalDays}</div>
                      <div className="text-gray-600 text-lg">total days</div>
                      <div className="text-sm text-gray-500">
                        Avg: {type.totalVacations > 0 ? Math.round(type.totalDays / type.totalVacations * 10) / 10 : 0} days/vacation
                      </div>
                    </div>
                  </div>
                  
                  {/* Type Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">👥</span>
                        Employees Using This Type
                      </h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex flex-wrap gap-2">
                          {type.employees.map((employee) => (
                            <span key={employee} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors duration-200">
                              👤 {employee}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">📊</span>
                        Type Statistics
                      </h4>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Vacations:</span>
                            <span className="text-2xl font-bold text-purple-600">{type.totalVacations}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Days:</span>
                            <span className="text-2xl font-bold text-pink-600">{type.totalDays}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Average per Vacation:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {type.totalVacations > 0 ? Math.round(type.totalDays / type.totalVacations * 10) / 10 : 0} days
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {analytics.byType.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🏖️</div>
                  <div className="text-xl">No vacation type data available</div>
                  <div className="text-sm mt-2">Type analytics will appear here once vacations are approved</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
