import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { CVForm } from './CVForm';
import { PaymentProofUpload } from './PaymentProofUpload';
import { FileText, User, Clock, CheckCircle, AlertCircle, CreditCard, Upload, Image, RefreshCw } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, addUpdateRequest, updateRequests, refreshData, loading } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'cv' | 'requests'>('overview');
  const [requestLoading, setRequestLoading] = useState(false);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Memoize current student to prevent unnecessary re-renders
  const currentStudent = useMemo(() => 
    students.find(s => s.email === user?.email), 
    [students, user?.email]
  );

  // Memoize student requests to prevent unnecessary re-renders
  const studentRequests = useMemo(() => 
    updateRequests.filter(r => r.studentId === currentStudent?.id), 
    [updateRequests, currentStudent?.id]
  );

  // Memoize status calculations
  const { isApproved, isPending, isRejected } = useMemo(() => ({
    isApproved: currentStudent?.status === 'approved',
    isPending: currentStudent?.status === 'pending',
    isRejected: currentStudent?.status === 'rejected'
  }), [currentStudent?.status]);

  // Debounced refresh function to prevent excessive calls
  const debouncedRefresh = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const now = Date.now();
          // Only refresh if it's been more than 5 seconds since last refresh
          if (now - lastRefresh > 5000 && !refreshing && !loading) {
            setLastRefresh(now);
            refreshData();
          }
        }, 1000);
      };
    })(),
    [lastRefresh, refreshing, loading, refreshData]
  );

  // Reduced auto-refresh frequency and better conditions
  useEffect(() => {
    const interval = setInterval(() => {
      debouncedRefresh();
    }, 30000); // Increased to 30 seconds to reduce flickering

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
    if (refreshing || loading) return;
    
    setRefreshing(true);
    try {
      await refreshData();
      setLastRefresh(Date.now());
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshing, loading, refreshData]);

  const handleUpdateRequest = async (type: 'cv_update' | 'personal_info' | 'payment_confirmation', description: string) => {
    if (currentStudent && description.trim() && !requestLoading) {
      setRequestLoading(true);
      try {
        const success = await addUpdateRequest({
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          type,
          description,
          status: 'pending'
        });
        
        if (success) {
          alert('Permintaan berhasil dikirim!');
        } else {
          alert('Gagal mengirim permintaan. Silakan coba lagi.');
        }
      } finally {
        setRequestLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'pending':
        return 'Menunggu Persetujuan';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Status Tidak Diketahui';
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

  // Show loading only on initial load
  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Siswa</h1>
            <p className="text-gray-600">Selamat datang, {user?.name}</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memperbarui...' : 'Refresh'}
          </button>
        </div>

        {/* Status Card - Memoized to prevent unnecessary re-renders */}
        {currentStudent && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Status Pendaftaran</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Terakhir diperbarui: {formatDate(currentStudent.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusIcon(currentStudent.status)}
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(currentStudent.status)}`}>
                  {getStatusText(currentStudent.status)}
                </span>
              </div>
            </div>

            {/* Status-specific messages */}
            {isPending && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Menunggu Persetujuan Admin</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Pendaftaran Anda sedang ditinjau oleh admin. Anda akan dapat mengakses CV dan ujian setelah disetujui.
                      Proses persetujuan biasanya memakan waktu 1-2 hari kerja.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Selamat! Akun Anda Telah Disetujui</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Anda sekarang dapat mengakses semua fitur termasuk mengisi CV dan mengikuti ujian.
                      Silakan lengkapi profil Anda untuk memulai pembelajaran.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Pendaftaran Ditolak</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Maaf, pendaftaran Anda tidak dapat disetujui. Silakan hubungi admin untuk informasi lebih lanjut
                      atau ajukan permintaan update jika ada kesalahan data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: User },
                { key: 'cv', label: 'CV & Profile', icon: FileText },
                { key: 'requests', label: 'Permintaan Update', icon: CreditCard }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && currentStudent && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Informasi Akun</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Detail Siswa</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama:</span>
                        <span className="font-medium">{currentStudent.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{currentStudent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telepon:</span>
                        <span className="font-medium">{currentStudent.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStudent.status)}`}>
                          {getStatusText(currentStudent.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tanggal Daftar:</span>
                        <span className="font-medium">
                          {formatDate(currentStudent.registrationDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">Status Pembayaran</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Pembayaran Terkonfirmasi</p>
                          <p className="text-xs text-green-600">Biaya pendaftaran telah dibayar</p>
                        </div>
                      </div>
                      <div className="bg-white/50 p-3 rounded border border-green-200">
                        <p className="text-xs text-green-700">
                          <strong>Total:</strong> Rp 525.000<br />
                          <strong>Status:</strong> Lunas
                        </p>
                      </div>
                      {currentStudent.paymentProof && (
                        <div className="flex items-center space-x-2">
                          <Image className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-700">Bukti pembayaran tersimpan</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('cv')}
                      disabled={!isApproved}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        isApproved 
                          ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900'
                          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      <h5 className="font-medium">Isi CV</h5>
                      <p className="text-sm opacity-75">
                        {isApproved ? 'Lengkapi profil dan CV Anda' : 'Tersedia setelah disetujui'}
                      </p>
                    </button>

                    <button
                      onClick={() => setShowPaymentUpload(true)}
                      className="p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-900 text-left transition-all"
                    >
                      <Upload className="h-6 w-6 mb-2" />
                      <h5 className="font-medium">Upload Bukti Bayar</h5>
                      <p className="text-sm opacity-75">Upload bukti pembayaran baru</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('requests')}
                      className="p-4 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-left transition-all"
                    >
                      <AlertCircle className="h-6 w-6 mb-2" />
                      <h5 className="font-medium">Permintaan Update</h5>
                      <p className="text-sm opacity-75">Lihat status permintaan ({studentRequests.length})</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cv' && (
              <div>
                {isApproved ? (
                  <CVForm />
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Terbatas</h3>
                    <p className="text-gray-600 mb-4">
                      Anda perlu menunggu persetujuan admin untuk mengakses fitur CV dan ujian.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-yellow-800">
                        Status saat ini: <strong>{getStatusText(currentStudent?.status || 'pending')}</strong><br />
                        {isPending && 'Estimasi waktu: 1-2 hari kerja'}
                        {isRejected && 'Silakan hubungi admin untuk informasi lebih lanjut'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Permintaan Update</h3>
                  <button
                    onClick={() => {
                      const description = prompt('Masukkan deskripsi permintaan update:');
                      if (description) {
                        handleUpdateRequest('cv_update', description);
                      }
                    }}
                    disabled={requestLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {requestLoading ? 'Mengirim...' : 'Buat Permintaan Baru'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { 
                      title: 'Update CV', 
                      desc: 'Permintaan untuk mengubah informasi CV',
                      action: () => {
                        const desc = prompt('Jelaskan perubahan yang diinginkan:');
                        if (desc) handleUpdateRequest('cv_update', desc);
                      }
                    },
                    { 
                      title: 'Update Info Personal', 
                      desc: 'Ubah nama, email, atau nomor telepon',
                      action: () => {
                        const desc = prompt('Jelaskan informasi yang ingin diubah:');
                        if (desc) handleUpdateRequest('personal_info', desc);
                      }
                    },
                    { 
                      title: 'Upload Bukti Bayar', 
                      desc: 'Upload bukti pembayaran baru',
                      action: () => setShowPaymentUpload(true)
                    }
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      disabled={requestLoading}
                      className="p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Riwayat Permintaan</h4>
                  {studentRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada permintaan</h3>
                      <p className="mt-1 text-sm text-gray-500">Permintaan update Anda akan muncul di sini</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentRequests.map((request) => (
                        <div key={request.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium text-gray-900">{request.type.replace('_', ' ').toUpperCase()}</h5>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                  {request.status === 'pending' ? 'Menunggu' : 
                                   request.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                              {request.paymentProof && (
                                <div className="flex items-center space-x-2 mb-2">
                                  <Image className="h-4 w-4 text-blue-600" />
                                  <span className="text-xs text-blue-600">Bukti pembayaran dilampirkan</span>
                                </div>
                              )}
                              <p className="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Proof Upload Modal */}
        {showPaymentUpload && currentStudent && (
          <PaymentProofUpload
            studentId={currentStudent.id}
            studentName={currentStudent.name}
            onSuccess={() => {
              setShowPaymentUpload(false);
              handleManualRefresh();
              alert('Bukti pembayaran berhasil diupload!');
            }}
            onCancel={() => setShowPaymentUpload(false)}
          />
        )}
      </div>
    </div>
  );
};