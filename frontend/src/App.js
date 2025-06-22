import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import RDPServers from "./components/RDPServers";
import ActiveConnections from "./components/ActiveConnections";
import AddServer from "./components/AddServer";
import { RDPProvider } from "./context/RDPContext";

function App() {
  return (
    <RDPProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servers" element={<RDPServers />} />
            <Route path="/connections" element={<ActiveConnections />} />
            <Route path="/add-server" element={<AddServer />} />
          </Routes>
        </BrowserRouter>
      </div>
    </RDPProvider>
  );
}

export default App;