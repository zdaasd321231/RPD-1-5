import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRDP } from "../context/RDPContext";
import GuacamoleClient from "./GuacamoleClient";

const RDPServers = () => {
  const { servers, loading, error, deleteServer, connectToServer } = useRDP();
  const [connecting, setConnecting] = useState(null);
  const [activeConnection, setActiveConnection] = useState(null);

  const handleConnect = async (serverId) => {
    try {
      setConnecting(serverId);
      await connectToServer(serverId);
      // Open Guacamole client
      setActiveConnection(serverId);
    } catch (err) {
      alert("Failed to connect to server");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = () => {
    setActiveConnection(null);
  };

  const handleDelete = async (serverId, serverName) => {
    if (window.confirm(`Are you sure you want to delete server "${serverName}"?`)) {
      try {
        await deleteServer(serverId);
      } catch (err) {
        alert("Failed to delete server");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "inactive":
        return "text-gray-400";
      case "connecting":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getOSIcon = (osType) => {
    switch (osType) {
      case "windows":
        return "🪟";
      case "linux":
        return "🐧";
      case "macos":
        return "🍎";
      default:
        return "💻";
    }
  };

  // If active connection, show Guacamole client
  if (activeConnection) {
    return (
      <GuacamoleClient 
        serverId={activeConnection} 
        onClose={handleDisconnect}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading servers...</div>
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
            <h1 className="text-4xl font-bold">RDP Servers</h1>
            <p className="text-gray-400 mt-2">
              🖥️ Web-based RDP connections via Apache Guacamole
            </p>
          </div>
          <Link
            to="/add-server"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add Server
          </Link>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Guacamole Status */}
        <div className="bg-blue-900 bg-opacity-20 border border-blue-500 border-opacity-30 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">🔗 Guacamole Integration</h3>
          <p className="text-sm text-gray-300">
            Servers will open in a web-based RDP client powered by Apache Guacamole. 
            No additional software required - everything runs in your browser!
          </p>
        </div>

        {/* Servers Grid */}
        {servers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🖥️</div>
            <h3 className="text-xl font-semibold mb-2">No servers configured</h3>
            <p className="text-gray-400 mb-6">Add your first RDP server to get started</p>
            <Link
              to="/add-server"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Add Server
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div key={server.id} className="bg-gray-800 p-6 rounded-lg hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getOSIcon(server.os_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{server.name}</h3>
                      <p className="text-gray-400 text-sm">{server.host}:{server.port}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                      {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                    </span>
                    {server.guacamole_connection_id && (
                      <span className="text-xs text-green-400 mt-1">✓ Guacamole</span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-300 mb-4">
                  <p><strong>Username:</strong> {server.username}</p>
                  {server.domain && <p><strong>Domain:</strong> {server.domain}</p>}
                  {server.description && <p><strong>Description:</strong> {server.description}</p>}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConnect(server.id)}
                    disabled={connecting === server.id}
                    className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                      connecting === server.id
                        ? "bg-yellow-600 text-white cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {connecting === server.id ? (
                      <span className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Connecting...
                      </span>
                    ) : (
                      "🚀 Connect"
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(server.id, server.name)}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connection Instructions */}
        {servers.length > 0 && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🔧 Connection Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Before Connecting:</h4>
                <ul className="space-y-1">
                  <li>• Ensure the target server has RDP enabled</li>
                  <li>• Verify network connectivity to the server</li>
                  <li>• Check username/password credentials</li>
                  <li>• Allow pop-ups for this website</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Connection Features:</h4>
                <ul className="space-y-1">
                  <li>• Full keyboard and mouse support</li>
                  <li>• Clipboard synchronization</li>
                  <li>• Fullscreen mode available</li>
                  <li>• No additional software required</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RDPServers;