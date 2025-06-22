#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse as urlparse
import uuid
from datetime import datetime

class GuacamoleMockHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/guacamole/api/tokens':
            # Mock authentication
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            params = urlparse.parse_qs(post_data)
            
            if 'username' in params and 'password' in params:
                response = {
                    "authToken": str(uuid.uuid4()),
                    "username": params['username'][0],
                    "dataSource": "postgresql",
                    "availableDataSources": ["postgresql"]
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(401)
                self.end_headers()
        
        elif 'connections' in self.path:
            # Mock connection creation
            response = {
                "identifier": str(uuid.uuid4()),
                "name": "Mock RDP Connection",
                "protocol": "rdp"
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        if 'connections' in self.path:
            # Mock connections list
            response = {
                "mock-connection-1": {
                    "identifier": "mock-connection-1",
                    "name": "Mock Windows Server",
                    "protocol": "rdp"
                }
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_DELETE(self):
        # Mock deletion
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), GuacamoleMockHandler)
    print("Mock Guacamole server running on http://localhost:8080")
    print("This is a development mock - not a real Guacamole server")
    server.serve_forever()
