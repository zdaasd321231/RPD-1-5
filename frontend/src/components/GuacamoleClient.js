import React, { useEffect, useRef, useState } from 'react';
import Guacamole from 'guacamole-common-js';

const GuacamoleClient = ({ serverId, onClose }) => {
  const displayRef = useRef(null);
  const clientRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [authToken, setAuthToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // First authenticate with Guacamole
        setStatus('Authenticating...');
        const authResponse = await fetch('/api/guacamole/tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=guacadmin&password=guacadmin'
        });

        if (!authResponse.ok) {
          throw new Error('Failed to authenticate with Guacamole');
        }

        const authData = await authResponse.json();
        const token = authData.authToken;
        setAuthToken(token);

        // Get connection details
        const connectionResponse = await fetch(`/api/guacamole/connection/${serverId}`);
        if (!connectionResponse.ok) {
          throw new Error('Failed to get connection details');
        }

        const connectionData = await connectionResponse.json();
        
        // Create WebSocket tunnel
        setStatus('Connecting...');
        const tunnel = new Guacamole.WebSocketTunnel('ws://localhost:8080/guacamole/websocket-tunnel');
        
        // Create Guacamole client
        const client = new Guacamole.Client(tunnel);
        clientRef.current = client;

        // Handle connection state changes
        client.onstatechange = (state) => {
          switch (state) {
            case Guacamole.Client.IDLE:
              setStatus('Ready');
              break;
            case Guacamole.Client.CONNECTING:
              setStatus('Connecting to server...');
              break;
            case Guacamole.Client.WAITING:
              setStatus('Waiting for server...');
              break;
            case Guacamole.Client.CONNECTED:
              setStatus('Connected');
              break;
            case Guacamole.Client.DISCONNECTING:
              setStatus('Disconnecting...');
              break;
            case Guacamole.Client.DISCONNECTED:
              setStatus('Disconnected');
              break;
            default:
              setStatus('Unknown state');
          }
        };

        // Handle errors
        client.onerror = (error) => {
          setError(`Connection error: ${error.message || 'Unknown error'}`);
          setStatus('Error');
        };

        // Add display to DOM
        if (displayRef.current) {
          const display = client.getDisplay();
          displayRef.current.appendChild(display.getElement());
          
          // Handle keyboard input
          const keyboard = new Guacamole.Keyboard(display.getElement());
          keyboard.onkeydown = (keysym) => {
            client.sendKeyEvent(1, keysym);
          };
          keyboard.onkeyup = (keysym) => {
            client.sendKeyEvent(0, keysym);
          };

          // Handle mouse input
          const mouse = new Guacamole.Mouse(display.getElement());
          mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState) => {
            client.sendMouseState(mouseState);
          };

          // Make display focusable
          display.getElement().setAttribute('tabindex', '0');
          display.getElement().focus();
        }

        // Connect with authentication token and connection ID
        const connectString = `token=${token}&GUAC_DATA_SOURCE=postgresql&GUAC_ID=${connectionData.connection_id}`;
        client.connect(connectString);

      } catch (err) {
        setError(err.message);
        setStatus('Failed to initialize');
      }
    };

    if (serverId) {
      initializeConnection();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [serverId]);

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    onClose();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Control Bar */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Status: {status}</span>
          {authToken && (
            <span className="text-green-400 text-sm">🟢 Authenticated</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (clientRef.current && displayRef.current) {
                const display = clientRef.current.getDisplay();
                if (display.getElement().requestFullscreen) {
                  display.getElement().requestFullscreen();
                }
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Fullscreen
          </button>
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* RDP Display */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
        {status === 'Connecting...' || status === 'Initializing...' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-lg">{status}</p>
            </div>
          </div>
        ) : null}
        
        <div
          ref={displayRef}
          className="w-full h-full flex items-center justify-center"
          style={{
            overflow: 'auto',
            background: '#000'
          }}
        />
      </div>

      {/* Instructions */}
      {status === 'Connected' && (
        <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg text-sm max-w-xs">
          <p className="text-gray-300">
            💡 <strong>Tips:</strong> Click in the display area to focus. 
            Use Ctrl+Alt+Shift to release mouse capture.
          </p>
        </div>
      )}
    </div>
  );
};

export default GuacamoleClient;