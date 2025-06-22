import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RDPContext = createContext();

export const useRDP = () => {
  const context = useContext(RDPContext);
  if (!context) {
    throw new Error("useRDP must be used within a RDPProvider");
  }
  return context;
};

export const RDPProvider = ({ children }) => {
  const [servers, setServers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/rdp-servers`);
      setServers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch servers");
      console.error("Error fetching servers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API}/connections/active`);
      setConnections(response.data);
    } catch (err) {
      console.error("Error fetching connections:", err);
    }
  };

  const createServer = async (serverData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/rdp-servers`, serverData);
      setServers(prev => [...prev, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      setError("Failed to create server");
      console.error("Error creating server:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteServer = async (serverId) => {
    try {
      await axios.delete(`${API}/rdp-servers/${serverId}`);
      setServers(prev => prev.filter(server => server.id !== serverId));
      setError(null);
    } catch (err) {
      setError("Failed to delete server");
      console.error("Error deleting server:", err);
      throw err;
    }
  };

  const connectToServer = async (serverId) => {
    try {
      const response = await axios.post(`${API}/connections`, { server_id: serverId });
      setConnections(prev => [...prev, response.data]);
      await fetchServers(); // Update server status
      return response.data;
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Error connecting to server:", err);
      throw err;
    }
  };

  const disconnectFromServer = async (connectionId) => {
    try {
      await axios.delete(`${API}/connections/${connectionId}`);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      await fetchServers(); // Update server status
    } catch (err) {
      setError("Failed to disconnect from server");
      console.error("Error disconnecting from server:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchServers();
    fetchConnections();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchServers();
      fetchConnections();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    servers,
    connections,
    loading,
    error,
    createServer,
    deleteServer,
    connectToServer,
    disconnectFromServer,
    fetchServers,
    fetchConnections,
  };

  return <RDPContext.Provider value={value}>{children}</RDPContext.Provider>;
};