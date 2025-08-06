# Network Configuration for Invoice Processing Pipeline
# This file contains network path settings and helper functions

import os

# Network configuration settings
NETWORK_CONFIG = {
    "projects_server": "192.168.1.130",
    "projects_share": "Projects", 
    "projects_folder": "Raj",
    "enable_network": True,
    "local_fallback": "data/network_fallback/",
    "network_ips": ["192.168.1.71", "192.168.1.130"]
}

def get_network_path():
    """Get the network path for projects folder"""
    return f"\\\\{NETWORK_CONFIG['projects_server']}\\{NETWORK_CONFIG['projects_share']}\\{NETWORK_CONFIG['projects_folder']}\\"

def get_local_fallback():
    """Get the local fallback path"""
    return NETWORK_CONFIG["local_fallback"]

def is_network_enabled():
    """Check if network access is enabled"""
    return NETWORK_CONFIG.get("enable_network", True)

def is_on_network():
    """Check if current machine is on the network"""
    import socket
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        return any(ip in local_ip for ip in NETWORK_CONFIG.get("network_ips", []))
    except:
        return False

def test_network_connectivity():
    """Test if network path is accessible"""
    network_path = get_network_path()
    try:
        return os.path.exists(network_path)
    except:
        return False

# Print configuration status
if __name__ == "__main__":
    print("Network Configuration:")
    print(f"Server: {NETWORK_CONFIG['projects_server']}")
    print(f"Share: {NETWORK_CONFIG['projects_share']}")
    print(f"Folder: {NETWORK_CONFIG['projects_folder']}")
    print(f"Network Enabled: {is_network_enabled()}")
    print(f"Network Accessible: {test_network_connectivity()}") 