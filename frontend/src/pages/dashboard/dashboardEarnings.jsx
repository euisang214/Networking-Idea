import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProfessionalsAPI from '../../api/professionals';
import SessionsAPI from '../../api/sessions';
import ReferralsAPI from '../../api/referrals';
import PaymentsAPI from '../../api/payment';
import Card from '../../components/common/card';
import Button from '../../components/common/button';
import Spinner from '../../components/common/spinner';

const DashboardEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    sessionEarnings: 0,
    referralEarnings: 0,
    pendingEarnings: 0,
    completedSessions: 0,
    verifiedReferrals: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [profileData, sessionsData, referralsData] = await Promise.all([
        ProfessionalsAPI.getOwnProfile(),
        SessionsAPI.getProfessionalSessions('all', 1, 50),
        ReferralsAPI.getProfessionalReferrals()
      ]);

      setProfile(profileData);
      
      // Calculate earnings
      const completedSessions = sessionsData.data.filter(s => s.status === 'completed');
      const paidSessions = sessionsData.data.filter(s => s.paymentStatus === 'released');
      const pendingSessions = sessionsData.data.filter(s => s.paymentStatus === 'paid' && s.status === 'completed');
      const verifiedReferrals = referralsData.filter(r => r.status === 'verified' || r.status === 'rewarded');
      const rewardedReferrals = referralsData.filter(r => r.status === 'rewarded');
      
      const sessionEarnings = paidSessions.reduce((sum, session) => {
        // Calculate after platform fee (15%)
        return sum + (session.price * 0.85);
      }, 0);
      
      const referralEarnings = rewardedReferrals.reduce((sum, referral) => {
        return sum + (referral.rewardAmount || 0);
      }, 0);

      const pendingEarnings = pendingSessions.reduce((sum, session) => {
        return sum + (session.price * 0.85);
      }, 0);

      setEarnings({
        totalEarnings: sessionEarnings + referralEarnings,
        sessionEarnings,
        referralEarnings,
        pendingEarnings,
        completedSessions: completedSessions.length,
        verifiedReferrals: verifiedReferrals.length
      });

      setRecentSessions(completedSessions.slice(0, 5));
      setRecentReferrals(referralsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnectingStripe(true);
      const result = await PaymentsAPI.createConnectedAccount();
      if (result.onboardingUrl) {
        window.location.href = result.onboardingUrl;
      }
    } catch (error) {
      console.error('Failed to connect Stripe account:', error);
      alert('Failed to connect payment account. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const StatCard = ({ title, value, color = 'blue', icon, subtitle }) => (
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
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading earnings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600">Track your income from sessions and referrals</p>
      </div>

      {/* Payment Account Status */}
      {!profile?.stripeConnectedAccountId && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Payment Account Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need to connect a payment account to receive earnings from sessions and referrals.
                </p>
              </div>
              <div className="ml-6 flex-shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnectStripe}
                  isLoading={connectingStripe}
                  disabled={connectingStripe}
                >
                  Connect Account
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Earnings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Earnings" 
          value={`$${earnings.totalEarnings.toLocaleString()}`}
          color="green"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582z" /><path fillRule="evenodd" d="M11 2a1 1 0 10-2 0v.071a7.927 7.927 0 00-.332.025A7.79 7.79 0 003 9.5v1.077c0 1.134.229 2.22.647 3.176A1.5 1.5 0 005.5 15h9a1.5 1.5 0 001.853-1.247A7.78 7.78 0 0017 10.577V9.5a7.79 7.79 0 00-5.668-7.404A7.927 7.927 0 0011 2.071V2zM9 4.071a5.79 5.79 0 012 0v.929a5.79 5.79 0 01-2 0V4.071z" clipRule="evenodd" /></svg>}
          subtitle="All-time earnings"
        />
        <StatCard 
          title="Session Earnings" 
          value={`$${earnings.sessionEarnings.toLocaleString()}`}
          color="blue"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          subtitle={`${earnings.completedSessions} completed sessions`}
        />
        <StatCard 
          title="Referral Earnings" 
          value={`$${earnings.referralEarnings.toLocaleString()}`}
          color="purple"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" /></svg>}
          subtitle={`${earnings.verifiedReferrals} verified referrals`}
        />
        <StatCard 
          title="Pending Earnings" 
          value={`$${earnings.pendingEarnings.toLocaleString()}`}
          color="yellow"
          icon={<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>}
          subtitle="Awaiting payout"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card title="Recent Completed Sessions">
          <div className="space-y-4">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div key={session._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {session.user?.firstName} {session.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.startTime).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                      session.paymentStatus === 'released' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.paymentStatus === 'released' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +${(session.price * 0.85).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${session.price} - 15% fee
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No completed sessions yet</p>
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

        {/* Recent Referrals */}
        <Card title="Recent Referrals">
          <div className="space-y-4">
            {recentReferrals.length > 0 ? (
              recentReferrals.map((referral) => (
                <div key={referral._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {referral.candidate?.email || referral.candidateEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                      referral.status === 'rewarded' 
                        ? 'bg-green-100 text-green-800' 
                        : referral.status === 'verified'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      referral.status === 'rewarded' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {referral.status === 'rewarded' ? '+' : ''}${(referral.rewardAmount || 0).toFixed(2)}
                    </p>
                    {referral.status !== 'rewarded' && (
                      <p className="text-xs text-gray-500">Potential</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            )}
            <div className="pt-4 border-t">
              <Link to="/dashboard/referrals">
                <Button variant="outline" size="sm" fullWidth>
                  View All Referrals
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Payout Information */}
      <Card title="Payout Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">How Payouts Work</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Session payments are released after completion and verification</li>
              <li>• Referral rewards are paid when verified referrals lead to placements</li>
              <li>• Payouts are processed weekly via Stripe</li>
              <li>• 15% platform fee is deducted from session earnings</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Settings</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Payout Schedule:</span> {profile?.payoutSettings?.payoutSchedule || 'Weekly'}</p>
              <p><span className="font-medium">Minimum Payout:</span> ${profile?.payoutSettings?.autoPayoutThreshold || 1}</p>
              <p><span className="font-medium">Payment Method:</span> {profile?.payoutSettings?.defaultMethod || 'Bank Account'}</p>
              <p>
                <span className="font-medium">Account Status:</span>{' '}
                <span className={profile?.stripeConnectedAccountId ? 'text-green-600' : 'text-yellow-600'}>
                  {profile?.stripeConnectedAccountId ? 'Connected' : 'Not Connected'}
                </span>
              </p>
            </div>
            <div className="mt-4">
              <Link to="/dashboard/settings">
                <Button variant="outline" size="sm">
                  Update Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardEarnings;