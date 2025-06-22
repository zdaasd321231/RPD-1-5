import React from "react";
import { Link } from "react-router-dom";
import { useRDP } from "../context/RDPContext";

const ActiveConnections = () => {
  const { connections, servers, loading, disconnectFromServer } = useRDP();

  const handleDisconnect = async (connectionId, serverName) => {
    if (window.confirm(`Are you sure you want to disconnect from "${serverName}"?`)) {
      try {
        await disconnectFromServer(connectionId);
      } catch (err) {
        alert("Failed to disconnect from server");
      }
    }
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link to="/" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold">Active Connections</h1>
            <p className="text-gray-400 mt-2">{connections.length} active connection(s)</p>
          </div>
          <Link
            to="/servers"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Manage Servers
          </Link>
        </div>

        {/* Connections List */}
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔌</div>
            <h3 className="text-xl font-semibold mb-2">No active connections</h3>
            <p className="text-gray-400 mb-6">Connect to an RDP server to see it here</p>
            <Link
              to="/servers"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              View Servers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => {
              const server = servers.find(s => s.id === connection.server_id);
              return (
                <div key={connection.id} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {server?.name || 'Unknown Server'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {server?.host}:{server?.port} • Connected as {server?.username}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Session ID: {connection.session_id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="font-semibold">
                          {formatDuration(connection.started_at)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => alert("Would open RDP client window (Demo mode)")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDisconnect(connection.id, server?.name || 'Unknown Server')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className="font-medium text-green-400">
                          {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">OS Type</p>
                        <p className="font-medium">
                          {server?.os_type?.charAt(0).toUpperCase() + server?.os_type?.slice(1) || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Domain</p>
                        <p className="font-medium">{server?.domain || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Started</p>
                        <p className="font-medium">
                          {new Date(connection.started_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connection Tips */}
        {connections.length > 0 && (
          <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-500 border-opacity-30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">💡 Connection Tips</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Use the "View" button to open the RDP client in a new window</li>
              <li>• Active connections are automatically saved and can be resumed</li>
              <li>• Disconnect when finished to free up server resources</li>
              <li>• Connection duration is tracked for monitoring purposes</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveConnections;