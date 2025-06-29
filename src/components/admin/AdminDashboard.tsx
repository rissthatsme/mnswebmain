import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { CVViewer } from './CVViewer';
import { Users, UserCheck, UserX, Clock, TrendingUp, Bell, CheckCircle, XCircle, Image, Eye, RefreshCw, FileText, Edit } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { students, updateStudentStatus, updateRequests, updateRequestStatus, refreshData, loading, cvs } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'approved' | 'requests' | 'cvs'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<string | null>(null);
  const [selectedStudentCV, setSelectedStudentCV] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Memoize filtered data to prevent unnecessary re-renders
  const { pendingStudents, approvedStudents, rejectedStudents, pendingRequests } = useMemo(() => ({
    pendingStudents: students.filter(s => s.status === 'pending'),
    approvedStudents: students.filter(s => s.status === 'approved'),
    rejectedStudents: students.filter(s => s.status === 'rejected'),
    pendingRequests: updateRequests.filter(r => r.status === 'pending')
  }), [students, updateRequests]);

  // Debounced refresh function to prevent excessive calls
  const debouncedRefresh = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const now = Date.now();
          // Only refresh if it's been more than 10 seconds since last refresh
          if (now - lastRefresh > 10000 && !refreshing && !loading && !actionLoading) {
            setLastRefresh(now);
            refreshData();
          }
        }, 2000);
      };
    })(),
    [lastRefresh, refreshing, loading, actionLoading, refreshData]
  );

  // Reduced auto-refresh frequency to prevent flickering
  useEffect(() => {
    const interval = setInterval(() => {
      debouncedRefresh();
    }, 60000); // Increased to 60 seconds

    return () => clearInterval(interval);
  }, [debouncedRefresh]);

  // Initial data load only if needed
  useEffect(() => {
    if (!loading && students.length === 0) {
      refreshData();
    }
  }, [refreshData, loading, students.length]);

  // Manual refresh function with better state management
  const handleManualRefresh = useCallback(async () => {
    if (refreshing || actionLoading) return;
    
    setRefreshing(true);
    try {
      await refreshData();
      setLastRefresh(Date.now());
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshing, actionLoading, refreshData]);

  const handleApproveStudent = async (studentId: string) => {
    if (actionLoading) return;
    
    setActionLoading(studentId);
    console.log('Approving student:', studentId);
    
    try {
      const success = await updateStudentStatus(studentId, 'approved');
      if (success) {
        alert('Siswa berhasil disetujui!');
        console.log('Student approved successfully');
      } else {
        alert('Gagal menyetujui siswa. Silakan coba lagi.');
        console.error('Failed to approve student');
      }
    } catch (error) {
      console.error('Error approving student:', error);
      alert('Terjadi kesalahan saat menyetujui siswa.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    if (actionLoading) return;
    
    setActionLoading(studentId);
    console.log('Rejecting student:', studentId);
    
    try {
      const success = await updateStudentStatus(studentId, 'rejected');
      if (success) {
        alert('Siswa berhasil ditolak!');
        console.log('Student rejected successfully');
      } else {
        alert('Gagal menolak siswa. Silakan coba lagi.');
        console.error('Failed to reject student');
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      alert('Terjadi kesalahan saat menolak siswa.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (actionLoading) return;
    
    setActionLoading(requestId);
    console.log('Approving request:', requestId);
    
    try {
      const success = await updateRequestStatus(requestId, 'approved');
      if (success) {
        alert('Permintaan berhasil disetujui!');
        console.log('Request approved successfully');
      } else {
        alert('Gagal menyetujui permintaan. Silakan coba lagi.');
        console.error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Terjadi kesalahan saat menyetujui permintaan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (actionLoading) return;
    
    setActionLoading(requestId);
    console.log('Rejecting request:', requestId);
    
    try {
      const success = await updateRequestStatus(requestId, 'rejected');
      if (success) {
        alert('Permintaan berhasil ditolak!');
        console.log('Request rejected successfully');
      } else {
        alert('Gagal menolak permintaan. Silakan coba lagi.');
        console.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Terjadi kesalahan saat menolak permintaan.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Memoize stats to prevent unnecessary calculations
  const stats = useMemo(() => [
    {
      name: 'Total Siswa',
      value: students.length,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      name: 'Menunggu Persetujuan',
      value: pendingStudents.length,
      icon: Clock,
      color: 'bg-yellow-500',
      change: `${pendingStudents.length} baru`
    },
    {
      name: 'Siswa Disetujui',
      value: approvedStudents.length,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      name: 'CV Tersedia',
      value: cvs.length,
      icon: FileText,
      color: 'bg-purple-500',
      change: `${cvs.length} CV`
    }
  ], [students.length, pendingStudents.length, approvedStudents.length, cvs.length]);

  // Show loading only on initial load
  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">Dashboard Admin</h1>
              <p className="text-gray-600 text-sm sm:text-base">Kelola siswa dan persetujuan pendaftaran</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Total: {students.length} siswa, {updateRequests.length} permintaan, {cvs.length} CV
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing || actionLoading !== null}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Memperbarui...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3 sm:p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-2 sm:p-3 flex-shrink-0`}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                  <div className="flex items-center">
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium hidden sm:inline">{stat.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation - Mobile Optimized */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex px-3 sm:px-6 overflow-x-auto scrollbar-hide">
              {[
                { key: 'overview', label: 'Overview', count: students.length },
                { key: 'pending', label: 'Pending', count: pendingStudents.length },
                { key: 'approved', label: 'Disetujui', count: approvedStudents.length },
                { key: 'requests', label: 'Permintaan', count: pendingRequests.length },
                { key: 'cvs', label: 'CV Siswa', count: cvs.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Ringkasan Siswa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 sm:p-6 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Menunggu Persetujuan</h4>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-900">{pendingStudents.length}</p>
                    <p className="text-xs sm:text-sm text-yellow-600 mt-1">Perlu ditinjau</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Disetujui</h4>
                    <p className="text-xl sm:text-2xl font-bold text-green-900">{approvedStudents.length}</p>
                    <p className="text-xs sm:text-sm text-green-600 mt-1">Aktif belajar</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
                    <h4 className="font-semibold text-purple-800 mb-2">CV Tersedia</h4>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">{cvs.length}</p>
                    <p className="text-xs sm:text-sm text-purple-600 mt-1">Dapat dilihat</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">Siswa Menunggu Persetujuan</h3>
                  <div className="text-sm text-gray-500">
                    Total: {pendingStudents.length} siswa
                  </div>
                </div>
                {pendingStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada siswa pending</h3>
                    <p className="mt-1 text-sm text-gray-500">Semua siswa sudah diproses</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingStudents.map((student) => (
                      <div key={student.id} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col space-y-2">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">{student.name}</h4>
                                <p className="text-sm text-gray-600 truncate">{student.email}</p>
                                <p className="text-sm text-gray-600 truncate">{student.phone}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Tanggal Daftar: {formatDate(student.registrationDate)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    student.paymentStatus === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {student.paymentStatus === 'confirmed' ? 'Pembayaran Terkonfirmasi' : 'Menunggu Pembayaran'}
                                  </span>
                                  {student.paymentProof && (
                                    <button
                                      onClick={() => setSelectedPaymentProof(student.paymentProof!)}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                                    >
                                      <Image className="h-3 w-3 mr-1" />
                                      Lihat Bukti
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                            <button
                              onClick={() => handleApproveStudent(student.id)}
                              disabled={actionLoading === student.id || actionLoading !== null}
                              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === student.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Setujui
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectStudent(student.id)}
                              disabled={actionLoading === student.id || actionLoading !== null}
                              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === student.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Tolak
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">Siswa Disetujui</h3>
                  <div className="text-sm text-gray-500">
                    Total: {approvedStudents.length} siswa
                  </div>
                </div>
                {approvedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada siswa disetujui</h3>
                    <p className="mt-1 text-sm text-gray-500">Siswa yang disetujui akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedStudents.map((student) => (
                      <div key={student.id} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                            <UserCheck className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{student.name}</h4>
                            <p className="text-sm text-gray-600 truncate">{student.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Disetujui: {formatDate(student.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedStudentCV(student.id)}
                            className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Lihat CV
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cvs' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">CV Siswa</h3>
                  <div className="text-sm text-gray-500">
                    Total: {cvs.length} CV tersedia
                  </div>
                </div>
                {cvs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada CV</h3>
                    <p className="mt-1 text-sm text-gray-500">CV siswa yang sudah diisi akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cvs.map((cv) => {
                      const student = students.find(s => s.id === cv.studentId);
                      return (
                        <div key={cv.id} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                              <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {cv.personalInfo.fullName || student?.name || 'Nama tidak tersedia'}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">
                                {cv.personalInfo.email || student?.email || 'Email tidak tersedia'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Diperbarui: {formatDate(cv.updatedAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex justify-between">
                              <span>Pendidikan:</span>
                              <span className="font-medium">{cv.education.length} item</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pengalaman:</span>
                              <span className="font-medium">{cv.experience.length} item</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Keahlian:</span>
                              <span className="font-medium">{cv.skills.length} skill</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedStudentCV(cv.studentId)}
                              className="flex-1 flex items-center justify-center px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Lihat Detail
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">Permintaan Update</h3>
                  <div className="text-sm text-gray-500">
                    Total: {updateRequests.length} permintaan
                  </div>
                </div>
                {updateRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada permintaan update</h3>
                    <p className="mt-1 text-sm text-gray-500">Permintaan update dari siswa akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateRequests.map((request) => (
                      <div key={request.id} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{request.studentName}</h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                request.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {request.status === 'pending' ? 'Menunggu' : 
                                 request.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {request.type.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                            {request.paymentProof && (
                              <button
                                onClick={() => setSelectedPaymentProof(request.paymentProof!)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors mb-2"
                              >
                                <Image className="h-3 w-3 mr-1" />
                                Lihat Bukti Pembayaran
                              </button>
                            )}
                            <p className="text-xs text-gray-500">
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                          {request.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                              <button 
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={actionLoading === request.id || actionLoading !== null}
                                className="flex items-center justify-center px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === request.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Setujui
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={actionLoading === request.id || actionLoading !== null}
                                className="flex items-center justify-center px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === request.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Tolak
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Proof Modal */}
        {selectedPaymentProof && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto w-full">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Bukti Pembayaran</h3>
                <button
                  onClick={() => setSelectedPaymentProof(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <img
                  src={selectedPaymentProof}
                  alt="Payment proof"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* CV Viewer Modal */}
        {selectedStudentCV && (
          <CVViewer
            studentId={selectedStudentCV}
            onClose={() => setSelectedStudentCV(null)}
          />
        )}
      </div>
    </div>
  );
};