import React from "react";
import { Link } from "react-router-dom";
import { useRDP } from "../context/RDPContext";

const Dashboard = () => {
  const { servers, connections, loading } = useRDP();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const activeServers = servers.filter(server => server.status === "active").length;
  const totalServers = servers.length;
  const activeConnections = connections.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400">RDP Manager</h1>
          <Link
            to="/add-server"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Add New Server
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Servers</p>
                <p className="text-3xl font-bold text-white">{totalServers}</p>
              </div>
              <div className="text-blue-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Servers</p>
                <p className="text-3xl font-bold text-green-400">{activeServers}</p>
              </div>
              <div className="text-green-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Connections</p>
                <p className="text-3xl font-bold text-yellow-400">{activeConnections}</p>
              </div>
              <div className="text-yellow-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/servers"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-lg transition-colors"
              >
                Manage RDP Servers
              </Link>
              <Link
                to="/connections"
                className="block w-full bg-green-600 hover:bg-green-700 text-center py-3 rounded-lg transition-colors"
              >
                View Active Connections
              </Link>
              <Link
                to="/add-server"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-center py-3 rounded-lg transition-colors"
              >
                Add New Server
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {connections.slice(0, 5).map((connection) => {
                const server = servers.find(s => s.id === connection.server_id);
                return (
                  <div key={connection.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      Connected to {server?.name || 'Unknown Server'}
                    </span>
                    <span className="text-green-400">Active</span>
                  </div>
                );
              })}
              {connections.length === 0 && (
                <p className="text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;