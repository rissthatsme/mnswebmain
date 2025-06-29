import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const { connectionStatus, error, retryConnection } = useData();

  if (connectionStatus === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`rounded-lg shadow-lg border p-4 ${
        connectionStatus === 'connecting' 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {connectionStatus === 'connecting' ? (
              <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
            ) : connectionStatus === 'disconnected' ? (
              <WifiOff className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${
              connectionStatus === 'connecting' ? 'text-yellow-800' : 'text-red-800'
            }`}>
              {connectionStatus === 'connecting' ? 'Menghubungkan...' : 'Koneksi Terputus'}
            </h3>
            
            {error && (
              <p className={`text-xs mt-1 ${
                connectionStatus === 'connecting' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {error}
              </p>
            )}
            
            {connectionStatus === 'disconnected' && (
              <button
                onClick={retryConnection}
                className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};