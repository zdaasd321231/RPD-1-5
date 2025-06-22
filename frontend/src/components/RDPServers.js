import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRDP } from "../context/RDPContext";

const RDPServers = () => {
  const { servers, loading, error, deleteServer, connectToServer } = useRDP();
  const [connecting, setConnecting] = useState(null);

  const handleConnect = async (serverId) => {
    try {
      setConnecting(serverId);
      await connectToServer(serverId);
      // In a real implementation, this would open the RDP client
      alert("RDP connection initiated! (Demo mode - would open RDP client)");
    } catch (err) {
      alert("Failed to connect to server");
    } finally {
      setConnecting(null);
    }
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
              <div key={server.id} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getOSIcon(server.os_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{server.name}</h3>
                      <p className="text-gray-400 text-sm">{server.host}:{server.port}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                    {server.status.charAt(0).toUpperCase() + server.status.slice(1)}
                  </span>
                </div>

                <div className="text-sm text-gray-300 mb-4">
                  <p><strong>Username:</strong> {server.username}</p>
                  {server.domain && <p><strong>Domain:</strong> {server.domain}</p>}
                  {server.description && <p><strong>Description:</strong> {server.description}</p>}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleConnect(server.id)}
                    disabled={connecting === server.id || server.status === "active"}
                    className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                      server.status === "active"
                        ? "bg-green-600 text-white cursor-not-allowed"
                        : connecting === server.id
                        ? "bg-yellow-600 text-white cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {connecting === server.id
                      ? "Connecting..."
                      : server.status === "active"
                      ? "Connected"
                      : "Connect"}
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
      </div>
    </div>
  );
};

export default RDPServers;