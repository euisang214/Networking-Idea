import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SessionsAPI from '../../api/sessions';
import Card from '../../components/common/card';
import Button from '../../components/common/button';
import Spinner from '../../components/common/spinner';

const DashboardSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    fetchSessions();
  }, [filter, pagination.page]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await SessionsAPI.getProfessionalSessions(
        filter === 'all' ? null : filter,
        pagination.page,
        pagination.limit
      );
      setSessions(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0
      }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSession = async (sessionId, startTime, endTime) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }));
      await SessionsAPI.confirmSession(sessionId, startTime, endTime);
      await fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Failed to confirm session:', error);
      alert('Failed to confirm session. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleUpdateStatus = async (sessionId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: true }));
      await SessionsAPI.updateSessionStatus(sessionId, newStatus);
      await fetchSessions();
    } catch (error) {
      console.error('Failed to update session status:', error);
      alert('Failed to update session status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      released: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && pagination.page === 1) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading sessions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <p className="text-gray-600">Manage your networking sessions and availability</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="requested">Requested</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1" />
            <div className="text-sm text-gray-500">
              {pagination.total} total sessions
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="divide-y divide-gray-200">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* Candidate Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {session.user?.firstName} {session.user?.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{session.user?.email}</p>
                        {session.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Notes:</span> {session.notes}
                          </p>
                        )}
                      </div>

                      {/* Session Details */}
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(session.paymentStatus)}`}>
                            {session.paymentStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.startTime)}
                        </p>
                        <p className="text-lg font-medium text-gray-900">
                          ${session.price}
                        </p>
                      </div>
                    </div>

                    {/* Candidate Availabilities (for requested sessions) */}
                    {session.status === 'requested' && session.candidateAvailabilities && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Candidate's Available Times:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {session.candidateAvailabilities.map((availability, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {formatDate(availability.startTime)} - {formatDate(availability.endTime)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center space-x-2">
                      <Link to={`/sessions/${session._id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>

                      {session.status === 'requested' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            // For simplicity, confirm with the first available time
                            // In a real app, you'd show a time selection modal
                            const firstAvailability = session.candidateAvailabilities?.[0];
                            if (firstAvailability) {
                              handleConfirmSession(
                                session._id,
                                firstAvailability.startTime,
                                firstAvailability.endTime
                              );
                            }
                          }}
                          isLoading={actionLoading[session._id]}
                          disabled={actionLoading[session._id]}
                        >
                          Confirm Session
                        </Button>
                      )}

                      {session.status === 'scheduled' && session.zoomMeetingUrl && (
                        <a
                          href={session.zoomMeetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="primary" size="sm">
                            Join Meeting
                          </Button>
                        </a>
                      )}

                      {(session.status === 'scheduled' || session.status === 'requested') && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUpdateStatus(session._id, 'cancelled')}
                          isLoading={actionLoading[session._id]}
                          disabled={actionLoading[session._id]}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "You haven't received any session requests yet."
                  : `No sessions with status "${filter}".`
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardSessions;