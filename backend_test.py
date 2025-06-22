#!/usr/bin/env python3
import requests
import json
import time
import os
import sys
from dotenv import load_dotenv
import pytest

# Load environment variables from frontend/.env to get the backend URL
load_dotenv('/app/frontend/.env')

# Get the backend URL from environment variables
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in environment variables")
    sys.exit(1)

# Ensure the URL ends with /api for all our requests
API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

# Test data
windows_server = {
    "name": "Windows Server 2022",
    "host": "win-server.example.com",
    "port": 3389,
    "username": "administrator",
    "password": "SecureP@ssw0rd!",
    "domain": "EXAMPLE",
    "os_type": "windows",
    "description": "Primary Windows server for testing"
}

linux_server = {
    "name": "Ubuntu Server 22.04",
    "host": "ubuntu-server.example.com",
    "port": 3389,
    "username": "admin",
    "password": "L1nuxP@ssw0rd!",
    "os_type": "linux",
    "description": "Linux RDP server with xrdp"
}

# Global variables to store created resources for later tests
created_servers = []
created_connections = []

def test_health_check():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    response = requests.get(f"{API_URL}/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "RDP Manager API with Guacamole is running"
    print("✅ Health check endpoint is working")

def test_create_windows_server():
    """Test creating a Windows RDP server"""
    print("\n=== Testing Create Windows RDP Server ===")
    response = requests.post(f"{API_URL}/rdp-servers", json=windows_server)
    assert response.status_code == 200, f"Failed to create Windows server: {response.text}"
    data = response.json()
    
    # Verify the response contains expected fields
    assert "id" in data
    assert data["name"] == windows_server["name"]
    assert data["host"] == windows_server["host"]
    assert data["port"] == windows_server["port"]
    assert data["username"] == windows_server["username"]
    assert data["domain"] == windows_server["domain"]
    assert data["os_type"] == windows_server["os_type"]
    assert data["description"] == windows_server["description"]
    assert data["status"] == "inactive"
    
    # Store the server ID for later tests
    created_servers.append(data["id"])
    print(f"✅ Windows server created with ID: {data['id']}")
    return data["id"]

def test_create_linux_server():
    """Test creating a Linux RDP server"""
    print("\n=== Testing Create Linux RDP Server ===")
    response = requests.post(f"{API_URL}/rdp-servers", json=linux_server)
    assert response.status_code == 200, f"Failed to create Linux server: {response.text}"
    data = response.json()
    
    # Verify the response contains expected fields
    assert "id" in data
    assert data["name"] == linux_server["name"]
    assert data["host"] == linux_server["host"]
    assert data["port"] == linux_server["port"]
    assert data["username"] == linux_server["username"]
    assert data["os_type"] == linux_server["os_type"]
    assert data["description"] == linux_server["description"]
    assert data["status"] == "inactive"
    
    # Store the server ID for later tests
    created_servers.append(data["id"])
    print(f"✅ Linux server created with ID: {data['id']}")
    return data["id"]

def test_list_servers():
    """Test listing all RDP servers"""
    print("\n=== Testing List All RDP Servers ===")
    response = requests.get(f"{API_URL}/rdp-servers")
    assert response.status_code == 200, f"Failed to list servers: {response.text}"
    data = response.json()
    
    # Verify we have at least the servers we created
    assert len(data) >= len(created_servers)
    
    # Verify our created servers are in the list
    server_ids = [server["id"] for server in data]
    for server_id in created_servers:
        assert server_id in server_ids
    
    print(f"✅ Successfully listed {len(data)} RDP servers")
    return data

def test_get_server_details():
    """Test getting details for a specific RDP server"""
    print("\n=== Testing Get RDP Server Details ===")
    if not created_servers:
        pytest.skip("No servers created to test with")
    
    server_id = created_servers[0]
    response = requests.get(f"{API_URL}/rdp-servers/{server_id}")
    assert response.status_code == 200, f"Failed to get server details: {response.text}"
    data = response.json()
    
    # Verify the response contains the expected server
    assert data["id"] == server_id
    print(f"✅ Successfully retrieved details for server: {data['name']}")
    return data

def test_update_server():
    """Test updating an RDP server"""
    print("\n=== Testing Update RDP Server ===")
    if not created_servers:
        pytest.skip("No servers created to test with")
    
    server_id = created_servers[0]
    update_data = {
        "name": "Updated Windows Server",
        "description": "This server has been updated"
    }
    
    response = requests.put(f"{API_URL}/rdp-servers/{server_id}", json=update_data)
    assert response.status_code == 200, f"Failed to update server: {response.text}"
    data = response.json()
    
    # Verify the updates were applied
    assert data["id"] == server_id
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    print(f"✅ Successfully updated server: {data['name']}")
    return data

def test_create_connection():
    """Test creating an RDP connection"""
    print("\n=== Testing Create RDP Connection ===")
    if not created_servers:
        pytest.skip("No servers created to test with")
    
    server_id = created_servers[0]
    connection_data = {
        "server_id": server_id
    }
    
    response = requests.post(f"{API_URL}/connections", json=connection_data)
    assert response.status_code == 200, f"Failed to create connection: {response.text}"
    data = response.json()
    
    # Verify the response contains expected fields
    assert "id" in data
    assert data["server_id"] == server_id
    assert data["status"] == "connecting"
    assert "session_id" in data
    assert "started_at" in data
    
    # Store the connection ID for later tests
    created_connections.append(data["id"])
    print(f"✅ Connection created with ID: {data['id']}")
    
    # Verify the server status was updated to active
    server_response = requests.get(f"{API_URL}/rdp-servers/{server_id}")
    assert server_response.status_code == 200
    server_data = server_response.json()
    assert server_data["status"] == "active"
    print(f"✅ Server status updated to active")
    
    return data["id"]

def test_list_connections():
    """Test listing all RDP connections"""
    print("\n=== Testing List All RDP Connections ===")
    response = requests.get(f"{API_URL}/connections")
    assert response.status_code == 200, f"Failed to list connections: {response.text}"
    data = response.json()
    
    # Verify we have at least the connections we created
    assert len(data) >= len(created_connections)
    
    # Verify our created connections are in the list
    connection_ids = [conn["id"] for conn in data]
    for conn_id in created_connections:
        assert conn_id in connection_ids
    
    print(f"✅ Successfully listed {len(data)} RDP connections")
    return data

def test_list_active_connections():
    """Test listing active RDP connections"""
    print("\n=== Testing List Active RDP Connections ===")
    response = requests.get(f"{API_URL}/connections/active")
    assert response.status_code == 200, f"Failed to list active connections: {response.text}"
    data = response.json()
    
    # Verify our created connections are in the active list
    connection_ids = [conn["id"] for conn in data]
    for conn_id in created_connections:
        assert conn_id in connection_ids
    
    print(f"✅ Successfully listed {len(data)} active RDP connections")
    return data

def test_end_connection():
    """Test ending an RDP connection"""
    print("\n=== Testing End RDP Connection ===")
    if not created_connections:
        pytest.skip("No connections created to test with")
    
    connection_id = created_connections[0]
    response = requests.delete(f"{API_URL}/connections/{connection_id}")
    assert response.status_code == 200, f"Failed to end connection: {response.text}"
    data = response.json()
    
    # Verify the response contains success message
    assert "message" in data
    assert data["message"] == "Connection ended successfully"
    print(f"✅ Successfully ended connection: {connection_id}")
    
    # Verify the connection is no longer in the active list
    active_response = requests.get(f"{API_URL}/connections/active")
    assert active_response.status_code == 200
    active_data = active_response.json()
    active_connection_ids = [conn["id"] for conn in active_data]
    assert connection_id not in active_connection_ids
    print(f"✅ Connection no longer in active list")
    
    return data

def test_delete_server():
    """Test deleting an RDP server"""
    print("\n=== Testing Delete RDP Server ===")
    if not created_servers:
        pytest.skip("No servers created to test with")
    
    server_id = created_servers[0]
    response = requests.delete(f"{API_URL}/rdp-servers/{server_id}")
    assert response.status_code == 200, f"Failed to delete server: {response.text}"
    data = response.json()
    
    # Verify the response contains success message
    assert "message" in data
    assert data["message"] == "RDP Server deleted successfully"
    print(f"✅ Successfully deleted server: {server_id}")
    
    # Verify the server is no longer in the list
    list_response = requests.get(f"{API_URL}/rdp-servers")
    assert list_response.status_code == 200
    list_data = list_response.json()
    server_ids = [server["id"] for server in list_data]
    assert server_id not in server_ids
    print(f"✅ Server no longer in server list")
    
    # Remove the server from our tracking list
    created_servers.remove(server_id)
    return data

def test_error_cases():
    """Test error cases and validation"""
    print("\n=== Testing Error Cases ===")
    
    # Test 404 for non-existent server
    print("Testing 404 for non-existent server...")
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    response = requests.get(f"{API_URL}/rdp-servers/{non_existent_id}")
    assert response.status_code == 404
    print("✅ Correctly returned 404 for non-existent server")
    
    # Test 404 for non-existent connection
    print("Testing 404 for non-existent connection...")
    response = requests.delete(f"{API_URL}/connections/{non_existent_id}")
    assert response.status_code == 404
    print("✅ Correctly returned 404 for non-existent connection")
    
    # Test validation for required fields
    print("Testing validation for required fields...")
    # Missing required field (password)
    invalid_server = {
        "name": "Test Server",
        "host": "test.example.com",
        "username": "test"
        # Missing password field
    }
    response = requests.post(f"{API_URL}/rdp-servers", json=invalid_server)
    assert response.status_code in [400, 422], f"Expected validation error, got {response.status_code}"
    print("✅ Correctly handled validation for required fields")
    
    # Test invalid connection creation (non-existent server)
    print("Testing invalid connection creation...")
    invalid_connection = {
        "server_id": non_existent_id
    }
    response = requests.post(f"{API_URL}/connections", json=invalid_connection)
    assert response.status_code == 404
    print("✅ Correctly rejected connection to non-existent server")

def cleanup():
    """Clean up any remaining test resources"""
    print("\n=== Cleaning Up Test Resources ===")
    
    # End any remaining connections
    for conn_id in created_connections[:]:
        try:
            requests.delete(f"{API_URL}/connections/{conn_id}")
            created_connections.remove(conn_id)
            print(f"Cleaned up connection: {conn_id}")
        except Exception as e:
            print(f"Error cleaning up connection {conn_id}: {e}")
    
    # Delete any remaining servers
    for server_id in created_servers[:]:
        try:
            requests.delete(f"{API_URL}/rdp-servers/{server_id}")
            created_servers.remove(server_id)
            print(f"Cleaned up server: {server_id}")
        except Exception as e:
            print(f"Error cleaning up server {server_id}: {e}")

def run_all_tests():
    """Run all tests in sequence"""
    try:
        print("\n🔍 STARTING RDP MANAGER API TESTS 🔍")
        print(f"API URL: {API_URL}")
        
        # Run all tests
        test_health_check()
        windows_id = test_create_windows_server()
        linux_id = test_create_linux_server()
        test_list_servers()
        test_get_server_details()
        test_update_server()
        test_create_connection()
        test_list_connections()
        test_list_active_connections()
        test_end_connection()
        test_delete_server()
        test_error_cases()
        
        print("\n✅ ALL TESTS PASSED SUCCESSFULLY ✅")
        return True
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        return False
    finally:
        cleanup()

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)