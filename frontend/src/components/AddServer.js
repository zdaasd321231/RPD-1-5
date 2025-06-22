import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRDP } from "../context/RDPContext";

const AddServer = () => {
  const navigate = useNavigate();
  const { createServer, loading } = useRDP();
  
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: 3389,
    username: "",
    password: "",
    domain: "",
    os_type: "windows",
    description: "",
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "port" ? parseInt(value) || 3389 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Server name is required";
    }
    
    if (!formData.host.trim()) {
      newErrors.host = "Host address is required";
    }
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }
    
    if (formData.port < 1 || formData.port > 65535) {
      newErrors.port = "Port must be between 1 and 65535";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Remove empty optional fields
      const serverData = { ...formData };
      if (!serverData.domain.trim()) {
        delete serverData.domain;
      }
      if (!serverData.description.trim()) {
        delete serverData.description;
      }

      await createServer(serverData);
      navigate("/servers");
    } catch (error) {
      console.error("Failed to create server:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/servers" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
            ← Back to Servers
          </Link>
          <h1 className="text-4xl font-bold">Add New RDP Server</h1>
          <p className="text-gray-400 mt-2">Configure a new remote desktop connection</p>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Server Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-gray-700 border ${
                    errors.name ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                  placeholder="e.g., Office Desktop"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Host */}
              <div>
                <label htmlFor="host" className="block text-sm font-medium mb-2">
                  Host Address *
                </label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  className={`w-full bg-gray-700 border ${
                    errors.host ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                  placeholder="e.g., 192.168.1.100"
                />
                {errors.host && <p className="text-red-400 text-sm mt-1">{errors.host}</p>}
              </div>

              {/* Port */}
              <div>
                <label htmlFor="port" className="block text-sm font-medium mb-2">
                  Port
                </label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  min="1"
                  max="65535"
                  className={`w-full bg-gray-700 border ${
                    errors.port ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                />
                {errors.port && <p className="text-red-400 text-sm mt-1">{errors.port}</p>}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-gray-700 border ${
                    errors.username ? "border-red-500" : "border-gray-600"
                  } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500`}
                  placeholder="Username"
                />
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full bg-gray-700 border ${
                      errors.password ? "border-red-500" : "border-gray-600"
                    } rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-blue-500`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Domain */}
              <div>
                <label htmlFor="domain" className="block text-sm font-medium mb-2">
                  Domain (Optional)
                </label>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., COMPANY"
                />
              </div>

              {/* OS Type */}
              <div>
                <label htmlFor="os_type" className="block text-sm font-medium mb-2">
                  Operating System
                </label>
                <select
                  id="os_type"
                  name="os_type"
                  value={formData.os_type}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="windows">Windows</option>
                  <option value="linux">Linux</option>
                  <option value="macos">macOS</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Brief description of this server..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  loading
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading ? "Creating..." : "Create Server"}
              </button>
              <Link
                to="/servers"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 bg-yellow-900 bg-opacity-20 border border-yellow-500 border-opacity-30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">🔒 Security Notice</h3>
            <p className="text-sm text-gray-300">
              Passwords are encrypted and stored securely. For enhanced security, consider using 
              domain authentication or certificate-based authentication where possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServer;