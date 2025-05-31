import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import SessionsAPI from '../../api/sessions';
import ReferralsAPI from '../../api/referrals';
import ProfessionalsAPI from '../../api/professionals';
import Card from '../../components/common/card';
import Button from '../../components/common/button';
import Spinner from '../../components/common/spinner';

const DashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    pendingSessions: 0,
    totalEarnings: 0,
    totalReferrals: 0,
    verifiedReferrals: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sessionsData, referralsData, profileData] = await Promise.all([
        SessionsAPI.getProfessionalSessions('all', 1, 50),
        ReferralsAPI.getProfessionalReferrals(),
        ProfessionalsAPI.getOwnProfile()
      ]);

      // Calculate stats
      const completedSessions = sessionsData.data.filter(s => s.status === 'completed');
      const pendingSessions = sessionsData.data.filter(s => s.status === 'scheduled');
      const verifiedReferrals = referralsData.filter(r => r.status === 'verified' || r.status === 'rewarded');

      setStats({
        totalSessions: sessionsData.data.length,
        completedSessions: completedSessions.length,
        pendingSessions: pendingSessions.length,
        totalEarnings: profileData.statistics?.totalEarnings || 0,
        totalReferrals: referralsData.length,
        verifiedReferrals: verifiedReferrals.length
      });

      setRecentSessions(sessionsData.data.slice(0, 5));
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color = 'blue', icon, link }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <div className={`w-6 h-6 text-${color}-600`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        {link && (
          <Link to={link} className="text-blue-600 hover:text-blue-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-blue-100">
          Here's an overview of your professional networking activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Sessions" 
          value={stats.totalSessions} 
          color="blue"
          link="/dashboard/sessions"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard 
          title="Completed Sessions" 
          value={stats.completedSessions} 
          color="green"
          link="/dashboard/sessions"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
        />
        <StatCard 
          title="Pending Sessions" 
          value={stats.pendingSessions} 
          color="yellow"
          link="/dashboard/sessions"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
        />
        <StatCard 
          title="Total Earnings" 
          value={`$${stats.totalEarnings.toLocaleString()}`} 
          color="purple"
          link="/dashboard/earnings"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582z" /><path fillRule="evenodd" d="M11 2a1 1 0 10-2 0v.071a7.927 7.927 0 00-.332.025A7.79 7.79 0 003 9.5v1.077c0 1.134.229 2.20.647 3.176A1.5 1.5 0 005.5 15h9a1.5 1.5 0 001.853-1.247A7.78 7.78 0 0017 10.577V9.5a7.79 7.79 0 00-5.668-7.404A7.927 7.927 0 0011 2.071V2zM9 4.071a5.79 5.79 0 012 0v.929a5.79 5.79 0 01-2 0V4.071z" clipRule="evenodd" /></svg>}
        />
        <StatCard 
          title="Total Referrals" 
          value={stats.totalReferrals} 
          color="indigo"
          link="/dashboard/referrals"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" /></svg>}
        />
        <StatCard 
          title="Verified Referrals" 
          value={stats.verifiedReferrals} 
          color="green"
          link="/dashboard/referrals"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card title="Recent Sessions" className="h-fit">
          <div className="space-y-4">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div key={session._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {session.user?.firstName} {session.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${session.price}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      session.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : session.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No sessions yet</p>
            )}
            <div className="pt-4 border-t">
              <Link to="/dashboard/sessions">
                <Button variant="outline" size="sm" fullWidth>
                  View All Sessions
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Profile Status & Quick Actions */}
        <Card title="Profile & Quick Actions" className="h-fit">
          <div className="space-y-4">
            {/* Profile Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Profile Status</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  profile?.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {profile?.isVerified 
                  ? 'Your profile is verified and you can receive payments.'
                  : 'Complete your profile setup to start receiving payments.'
                }
              </p>
              <Link to="/dashboard/profile">
                <Button variant="outline" size="sm">
                  {profile?.isVerified ? 'Edit Profile' : 'Complete Setup'}
                </Button>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <Link to="/dashboard/sessions">
                  <Button variant="outline" size="sm" fullWidth>
                    Manage Sessions
                  </Button>
                </Link>
                <Link to="/dashboard/referrals">
                  <Button variant="outline" size="sm" fullWidth>
                    View Referrals
                  </Button>
                </Link>
                <Link to="/dashboard/earnings">
                  <Button variant="outline" size="sm" fullWidth>
                    Check Earnings
                  </Button>
                </Link>
                <Link to="/dashboard/settings">
                  <Button variant="outline" size="sm" fullWidth>
                    Update Availability
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;