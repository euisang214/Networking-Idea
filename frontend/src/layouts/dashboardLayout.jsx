import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  CreditCardIcon,
  UsersIcon,
  CogIcon,
  BellIcon,
  LogoutIcon,
  MenuIcon,
  XIcon,
  UserGroupIcon
} from '@heroicons/react/outline';
import useAuth from '../hooks/useAuth';
import { Spinner } from '../components/common';

const DashboardLayout = () => {
  const { user, isSeeker, isProfessional, isAdmin, logout, loading } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
  };
  
  if (loading) {
    return <Spinner fullScreen />;
  }
  
  // Generate navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: location.pathname === '/dashboard'
      },
      {
        name: 'My Sessions',
        href: '/sessions',
        icon: CalendarIcon,
        current: location.pathname.startsWith('/sessions')
      },
      {
        name: 'Referrals',
        href: '/referrals',
        icon: UsersIcon,
        current: location.pathname.startsWith('/referrals')
      },
      {
        name: 'Profile',
        href: '/profile',
        icon: UserIcon,
        current: location.pathname === '/profile'
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: CogIcon,
        current: location.pathname.startsWith('/settings')
      }
    ];
    
    if (isSeeker) {
      return [
        ...commonItems,
        {
          name: 'Find Professionals',
          href: '/professionals',
          icon: UserGroupIcon,
          current: location.pathname.startsWith('/professionals')
        },
        {
          name: 'Payment History',
          href: '/settings/payments',
          icon: CreditCardIcon,
          current: location.pathname === '/settings/payments'
        }
      ];
    }
    
    if (isProfessional) {
      return [
        ...commonItems,
        {
          name: 'Professional Profile',
          href: '/professional-profile',
          icon: UserGroupIcon,
          current: location.pathname === '/professional-profile'
        },
        {
          name: 'Earnings',
          href: '/settings/earnings',
          icon: CreditCardIcon,
          current: location.pathname === '/settings/earnings'
        }
      ];
    }
    
    if (isAdmin) {
      return [
        ...commonItems,
        {
          name: 'Users',
          href: '/admin/users',
          icon: UserGroupIcon,
          current: location.pathname.startsWith('/admin/users')
        },
        {
          name: 'Payments',
          href: '/admin/payments',
          icon: CreditCardIcon,
          current: location.pathname.startsWith('/admin/payments')
        }
      ];
    }
    
    return commonItems;
  };
  
  const navItems = getNavItems();
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed inset-0 flex z-40">
          {/* Sidebar overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
          
          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white transform ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out`}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
              <div className="flex items-center">
                <img
                  className="h-8 w-auto"
                  src="/logo.svg"
                  alt="MentorConnect"
                />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  MentorConnect
                </span>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsSidebarOpen(false)}
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* User info */}
            <div className="px-4 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user?.profile_picture || '/default-avatar.png'}
                    alt={user?.first_name || 'User'}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sidebar navigation */}
            <nav className="flex-1 overflow-y-auto">
              <div className="px-2 py-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        item.current
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-4 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
            
            {/* Logout button */}
            <div className="px-2 py-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
              >
                <LogoutIcon className="mr-4 h-6 w-6 text-red-400 group-hover:text-red-500" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        {/* Sidebar header */}
        <div className="flex items-center h-16 px-4 bg-white border-b border-gray-200">
          <img
            className="h-8 w-auto"
            src="/logo.svg"
            alt="MentorConnect"
          />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            MentorConnect
          </span>
        </div>
        
        {/* User info */}
        <div className="px-4 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full"
                src={user?.profile_picture || '/default-avatar.png'}
                alt={user?.first_name || 'User'}
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs font-medium text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        
        {/* Sidebar navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    item.current
                      ? 'text-gray-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5`}
                />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
        
        {/* Logout button */}
        <div className="px-2 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
          >
            <LogoutIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <img
              className="h-8 w-auto ml-2"
              src="/logo.svg"
              alt="MentorConnect"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              MentorConnect
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/settings/notifications" className="relative">
              <BellIcon className="h-6 w-6 text-gray-500" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </Link>
            <Link to="/profile">
              <img
                className="h-8 w-8 rounded-full"
                src={user?.profile_picture || '/default-avatar.png'}
                alt={user?.first_name || 'User'}
              />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Desktop header */}
        <div className="hidden lg:flex lg:sticky lg:top-0 lg:z-10 lg:h-16 lg:bg-white lg:shadow-sm">
          <div className="flex-1 flex justify-end px-4">
            <div className="flex items-center space-x-4">
              <Link to="/settings/notifications" className="relative">
                <BellIcon className="h-6 w-6 text-gray-500" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 pb-8">
          <div className="mt-8 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
