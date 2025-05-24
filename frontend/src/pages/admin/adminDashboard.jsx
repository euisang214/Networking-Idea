import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminAPI from '../../api/admin';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalSessions: 0,
    pendingPayments: 0,
    activeReferrals: 0,
    totalRevenue: 0
  });
  const [sessions, setSessions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Redirect if not admin
  if (!user || user.userType !== 'admin') {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, sessionsData, referralsData] = await Promise.all([
        AdminAPI.getStats(),
        AdminAPI.getSessions(),
        AdminAPI.getReferrals()
      ]);
      
      setStats(statsData);
      setSessions(sessionsData);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`payment_${sessionId}`]: true }));
      await AdminAPI.releasePayment(sessionId);
      
      // Update local state
      setSessions(sessions.map(session => 
        session._id === sessionId 
          ? { ...session, paymentStatus: 'released' }
          : session
      ));
      
      // Update stats
      setStats(prev => ({ 
        ...prev, 
        pendingPayments: prev.pendingPayments - 1 
      }));
    } catch (error) {
      console.error('Failed to release payment:', error);
      alert('Failed to release payment. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`payment_${sessionId}`]: false }));
    }
  };

  const handleVerifyReferral = async (referralId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`referral_${referralId}`]: true }));
      await AdminAPI.verifyReferral(referralId);
      
      // Update local state
      setReferrals(referrals.map(referral => 
        referral._id === referralId 
          ? { ...referral, status: 'verified', rewardAmount: 50.00 }
          : referral
      ));
    } catch (error) {
      console.error('Failed to verify referral:', error);
      alert('Failed to verify referral. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`referral_${referralId}`]: false }));
    }
  };

  const StatCard = ({ title, value, color = 'blue', icon }) => (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <div className={`w-6 h-6 text-${color}-600`}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage sessions, payments, and referrals</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'sessions', 'referrals', 'users'].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Sessions" 
              value={stats.totalSessions} 
              color="blue"
              icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            <StatCard 
              title="Pending Payments" 
              value={stats.pendingPayments} 
              color="yellow"
              icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
            />
            <StatCard 
              title="Active Referrals" 
              value={stats.activeReferrals} 
              color="green"
              icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" /></svg>}
            />
            <StatCard 
              title="Total Revenue" 
              value={`$${stats.totalRevenue.toLocaleString()}`} 
              color="purple"
              icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582z" /></svg>}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Recent Sessions" className="p-6">
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">
                        {session.professional?.user?.firstName} {session.professional?.user?.lastName} ↔ {session.user?.firstName} {session.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${session.price}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.paymentStatus === 'released' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card title="Recent Referrals" className="p-6">
              <div className="space-y-3">
                {referrals.slice(0, 5).map((referral) => (
                  <div key={referral._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">
                        {referral.professional?.user?.firstName} {referral.professional?.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {referral.candidate?.email} → {referral.emailDetails?.recipientEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${referral.rewardAmount || 0}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        referral.status === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {referral.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Session Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.professional?.user?.firstName} {session.professional?.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          with {session.user?.firstName} {session.user?.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.paymentStatus === 'released' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${session.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {session.paymentStatus === 'paid' && session.status === 'completed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReleasePayment(session._id)}
                          isLoading={actionLoading[`payment_${session._id}`]}
                          disabled={actionLoading[`payment_${session._id}`]}
                        >
                          Release Payment
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Referral Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {referral.professional?.user?.firstName} {referral.professional?.user?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{referral.candidate?.email}</div>
                        <div className="text-sm text-gray-500">→ {referral.emailDetails?.recipientEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        referral.status === 'verified' || referral.status === 'rewarded'
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${referral.rewardAmount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {referral.status === 'pending' && referral.emailDomainVerified && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerifyReferral(referral._id)}
                          isLoading={actionLoading[`referral_${referral._id}`]}
                          disabled={actionLoading[`referral_${referral._id}`]}
                        >
                          Verify & Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Users Tab - Placeholder */}
      {activeTab === 'users' && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
          <p className="text-gray-500">User management features would be implemented here.</p>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;