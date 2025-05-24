import React, { useState, useEffect } from 'react';
import AdminAPI from '../../api/admin';
import Card from '../../components/common/Card';
import StatsCard from '../../components/admin/StatsCard';
import Spinner from '../../components/common/Spinner';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsData = await AdminAPI.getAnalytics(timeRange);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div>
      {/* Key Metrics Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Sessions"
          value={analytics?.sessionsOverTime?.reduce((sum, day) => sum + day.count, 0) || 0}
          color="blue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(analytics?.revenueOverTime?.reduce((sum, day) => sum + day.revenue, 0) || 0)}
          color="green"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatsCard
          title="New Users"
          value={analytics?.userGrowth?.reduce((sum, day) => sum + day.count, 0) || 0}
          color="purple"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        
        <StatsCard
          title="Avg Session Value"
          value={(() => {
            const totalSessions = analytics?.sessionsOverTime?.reduce((sum, day) => sum + day.count, 0) || 0;
            const totalRevenue = analytics?.revenueOverTime?.reduce((sum, day) => sum + day.revenue, 0) || 0;
            const avgValue = totalSessions > 0 ? totalRevenue / totalSessions : 0;
            return formatCurrency(avgValue);
          })()}
          color="yellow"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Top Professionals */}
      <Card title="Top Performing Professionals" className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earnings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.topProfessionals?.slice(0, 10).map((professional) => (
                <tr key={professional._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {professional.userInfo?.[0]?.firstName} {professional.userInfo?.[0]?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {professional.userInfo?.[0]?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {professional.totalSessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(professional.totalEarnings || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sessions Over Time">
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Session trend chart would be implemented here</p>
              <p className="text-sm mt-2">
                Total data points: {analytics?.sessionsOverTime?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Revenue Over Time">
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Revenue trend chart would be implemented here</p>
              <p className="text-sm mt-2">
                Total data points: {analytics?.revenueOverTime?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;