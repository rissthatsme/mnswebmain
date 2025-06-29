import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { X, Bell, CheckCircle, Clock, AlertCircle, Trash2, BookMarked as MarkAsRead } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
  createdAt: string;
  relatedId?: string;
  dismissed?: boolean; // Add dismissed flag
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Storage keys for persisting notification state
const STORAGE_KEYS = {
  NOTIFICATIONS: 'lpk_notifications',
  DISMISSED: 'lpk_dismissed_notifications',
  READ: 'lpk_read_notifications'
};

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { students, updateRequests } = useData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const dismissedData = localStorage.getItem(STORAGE_KEYS.DISMISSED);
      const readData = localStorage.getItem(STORAGE_KEYS.READ);
      
      if (dismissedData) {
        setDismissedIds(new Set(JSON.parse(dismissedData)));
      }
      
      if (readData) {
        setReadIds(new Set(JSON.parse(readData)));
      }
    } catch (error) {
      console.error('Error loading notification state:', error);
    }
  }, []);

  // Save dismissed and read state to localStorage
  const saveDismissedState = useCallback((dismissed: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISMISSED, JSON.stringify(Array.from(dismissed)));
    } catch (error) {
      console.error('Error saving dismissed state:', error);
    }
  }, []);

  const saveReadState = useCallback((read: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEYS.READ, JSON.stringify(Array.from(read)));
    } catch (error) {
      console.error('Error saving read state:', error);
    }
  }, []);

  // Generate notifications based on user role and data
  const generateNotifications = useCallback(() => {
    if (!user) return [];

    const generatedNotifications: Notification[] = [];

    if (user.role === 'admin') {
      // Admin notifications
      const pendingStudents = students.filter(s => s.status === 'pending');
      const pendingRequests = updateRequests.filter(r => r.status === 'pending');

      if (pendingStudents.length > 0) {
        const id = 'pending-students';
        generatedNotifications.push({
          id,
          title: 'Siswa Menunggu Persetujuan',
          message: `${pendingStudents.length} siswa menunggu persetujuan pendaftaran`,
          type: 'warning',
          read: readIds.has(id),
          createdAt: new Date().toISOString(),
          dismissed: dismissedIds.has(id)
        });
      }

      if (pendingRequests.length > 0) {
        const id = 'pending-requests';
        generatedNotifications.push({
          id,
          title: 'Permintaan Update Baru',
          message: `${pendingRequests.length} permintaan update menunggu ditinjau`,
          type: 'info',
          read: readIds.has(id),
          createdAt: new Date().toISOString(),
          dismissed: dismissedIds.has(id)
        });
      }

      // Recent approvals (last 24 hours)
      const recentApprovals = students.filter(s => 
        s.status === 'approved' && 
        new Date(s.updatedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      if (recentApprovals.length > 0) {
        const id = 'recent-approvals';
        generatedNotifications.push({
          id,
          title: 'Siswa Baru Disetujui',
          message: `${recentApprovals.length} siswa telah disetujui dalam 24 jam terakhir`,
          type: 'success',
          read: readIds.has(id),
          createdAt: new Date().toISOString(),
          dismissed: dismissedIds.has(id)
        });
      }
    } else {
      // Student notifications
      const currentStudent = students.find(s => s.email === user.email);
      const studentRequests = updateRequests.filter(r => r.studentId === currentStudent?.id);

      if (currentStudent) {
        // Account status notification
        const accountStatusId = `account-status-${currentStudent.status}`;
        if (currentStudent.status === 'approved') {
          generatedNotifications.push({
            id: accountStatusId,
            title: 'Akun Disetujui!',
            message: 'Selamat! Akun Anda telah disetujui. Anda sekarang dapat mengakses semua fitur.',
            type: 'success',
            read: readIds.has(accountStatusId),
            createdAt: currentStudent.updatedAt,
            dismissed: dismissedIds.has(accountStatusId)
          });
        } else if (currentStudent.status === 'rejected') {
          generatedNotifications.push({
            id: accountStatusId,
            title: 'Akun Ditolak',
            message: 'Maaf, pendaftaran Anda tidak dapat disetujui. Silakan hubungi admin.',
            type: 'error',
            read: readIds.has(accountStatusId),
            createdAt: currentStudent.updatedAt,
            dismissed: dismissedIds.has(accountStatusId)
          });
        } else if (currentStudent.status === 'pending') {
          generatedNotifications.push({
            id: accountStatusId,
            title: 'Menunggu Persetujuan',
            message: 'Akun Anda sedang ditinjau oleh admin. Mohon tunggu 1-2 hari kerja.',
            type: 'info',
            read: readIds.has(accountStatusId),
            createdAt: currentStudent.createdAt,
            dismissed: dismissedIds.has(accountStatusId)
          });
        }

        // Request status updates (last 7 days to avoid too many notifications)
        const recentRequests = studentRequests.filter(r => 
          (r.status === 'approved' || r.status === 'rejected') &&
          new Date(r.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );

        recentRequests.forEach(request => {
          const requestId = `request-${request.status}-${request.id}`;
          generatedNotifications.push({
            id: requestId,
            title: request.status === 'approved' ? 'Permintaan Disetujui' : 'Permintaan Ditolak',
            message: `Permintaan ${request.type.replace('_', ' ')} Anda telah ${request.status === 'approved' ? 'disetujui' : 'ditolak'}`,
            type: request.status === 'approved' ? 'success' : 'error',
            read: readIds.has(requestId),
            createdAt: request.updatedAt,
            relatedId: request.id,
            dismissed: dismissedIds.has(requestId)
          });
        });
      }
    }

    // Welcome notification (only show once, after 1 day auto-read)
    const welcomeId = `welcome-${user.id}`;
    const isWelcomeAutoRead = new Date().getTime() - new Date(user.createdAt).getTime() > 24 * 60 * 60 * 1000;
    
    generatedNotifications.push({
      id: welcomeId,
      title: 'Selamat Datang!',
      message: `Selamat datang di LPK Training Center, ${user.name}!`,
      type: 'info',
      read: readIds.has(welcomeId) || isWelcomeAutoRead,
      createdAt: user.createdAt,
      dismissed: dismissedIds.has(welcomeId)
    });

    // Filter out dismissed notifications and sort by date
    return generatedNotifications
      .filter(n => !n.dismissed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user, students, updateRequests, dismissedIds, readIds]);

  // Update notifications when dependencies change
  useEffect(() => {
    const newNotifications = generateNotifications();
    setNotifications(newNotifications);
  }, [generateNotifications]);

  if (!isOpen) return null;

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    saveReadState(newReadIds);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadIds = new Set([...readIds, ...allIds]);
    setReadIds(newReadIds);
    saveReadState(newReadIds);
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    const newDismissedIds = new Set(dismissedIds);
    newDismissedIds.add(id);
    setDismissedIds(newDismissedIds);
    saveDismissedState(newDismissedIds);
    
    // Remove from current notifications
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Baru saja';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`;
    } else if (diffInHours < 48) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter and Actions */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <MarkAsRead className="h-4 w-4 mr-1" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'unread' 
                  ? 'Semua notifikasi sudah dibaca'
                  : 'Notifikasi akan muncul di sini'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Tandai dibaca"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Hapus notifikasi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Notifikasi yang dihapus tidak akan muncul lagi
          </p>
        </div>
      </div>
    </div>
  );
};