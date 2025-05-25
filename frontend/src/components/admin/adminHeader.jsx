import React from 'react';
import { useAuth } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">MentorConnect Admin</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.firstName?.charAt(0)}
              </span>
            </div>
            <span className="text-sm text-gray-700">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          
          <Button variant="light" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;