import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { LogOut, User, Settings, Bell, Menu, X } from 'lucide-react';
import { SettingsModal } from './common/SettingsModal';
import { NotificationModal } from './common/NotificationModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { students, updateRequests } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Calculate notification count
  const getNotificationCount = () => {
    if (!user) return 0;

    if (user.role === 'admin') {
      const pendingStudents = students.filter(s => s.status === 'pending').length;
      const pendingRequests = updateRequests.filter(r => r.status === 'pending').length;
      return pendingStudents + pendingRequests;
    } else {
      const currentStudent = students.find(s => s.email === user.email);
      if (!currentStudent) return 0;

      let count = 0;
      
      // Account status notifications
      if (currentStudent.status === 'approved' || currentStudent.status === 'rejected') {
        count += 1;
      }

      // Recent request updates (last 24 hours)
      const studentRequests = updateRequests.filter(r => r.studentId === currentStudent.id);
      const recentUpdates = studentRequests.filter(r => 
        (r.status === 'approved' || r.status === 'rejected') &&
        new Date(r.updatedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      count += recentUpdates.length;

      return count;
    }
  };

  const notificationCount = getNotificationCount();

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openSettings = () => {
    setSettingsOpen(true);
    setMobileMenuOpen(false);
  };

  const openNotifications = () => {
    setNotificationsOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">LPK </span>
                <span className="text-blue-600">
                  {user?.role === 'admin' ? 'Admin' : 'Training'}
                </span>
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <span>{user?.name}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {user?.role === 'admin' ? 'Admin' : 'Siswa'}
                </span>
              </div>

              <button 
                onClick={openNotifications}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              <button 
                onClick={openSettings}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* User Info */}
                <div className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md">
                  <User className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{user?.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex-shrink-0">
                    {user?.role === 'admin' ? 'Admin' : 'Siswa'}
                  </span>
                </div>

                {/* Menu Items */}
                <button 
                  onClick={openNotifications}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="relative">
                    <Bell className="h-4 w-4 mr-3" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                  <span>Notifikasi</span>
                  {notificationCount > 0 && (
                    <span className="ml-auto px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={openSettings}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Pengaturan
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NotificationModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
};