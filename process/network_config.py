# Network Configuration for Invoice Processing Pipeline
# This file contains network path settings and helper functions

import os

# Network configuration settings
NETWORK_CONFIG = {
    "projects_server": "192.168.1.130",
    "projects_share": "Projects", 
    "projects_folder": "Raj",
    "project_list_file": "Project List -.xlsx",
    "accounting_server": "192.168.1.130",
    "accounting_share": "Accounting",
    "accounts_payable_folder": "Accounts Payable",
    "job_uploaded_folder": "JOB UPLOADED",
    "enable_network": True,
    "local_fallback": "data/network_fallback/",
    "network_ips": ["192.168.1.71", "192.168.1.130"]
}

def get_network_path():
    """Get the network path for projects folder"""
    return f"\\\\{NETWORK_CONFIG['projects_server']}\\{NETWORK_CONFIG['projects_share']}\\{NETWORK_CONFIG['projects_folder']}\\"

def get_project_list_path():
    """Get the network path for the Project List file"""
    return f"\\\\{NETWORK_CONFIG['projects_server']}\\{NETWORK_CONFIG['projects_share']}\\Project List\\{NETWORK_CONFIG['project_list_file']}"

def get_accounting_network_path():
    """Get the network path for Accounting/Accounts Payable/JOB UPLOADED"""
    return f"\\\\{NETWORK_CONFIG['accounting_server']}\\{NETWORK_CONFIG['accounting_share']}\\{NETWORK_CONFIG['accounts_payable_folder']}\\{NETWORK_CONFIG['job_uploaded_folder']}\\"

def get_local_fallback():
    """Get local fallback path"""
    return NETWORK_CONFIG['local_fallback']

def is_network_enabled():
    """Check if network access is enabled"""
    return NETWORK_CONFIG.get('enable_network', True)

def test_network_access():
    """Test network accessibility"""
    try:
        projects_path = get_network_path()
        if os.path.exists(projects_path):
            print(f"✅ Projects folder accessible: {projects_path}")
            return True
        else:
            print(f"❌ Projects folder not accessible: {projects_path}")
            return False
    except Exception as e:
        print(f"❌ Network access error: {e}")
        return False

def test_project_list_access():
    """Test Project List file accessibility"""
    try:
        project_list_path = get_project_list_path()
        if os.path.exists(project_list_path):
            print(f"✅ Project List file accessible: {project_list_path}")
            return True
        else:
            print(f"❌ Project List file not accessible: {project_list_path}")
            return False
    except Exception as e:
        print(f"❌ Project List access error: {e}")
        return False

def test_accounting_network_access():
    """Test Accounting network path accessibility"""
    try:
        accounting_path = get_accounting_network_path()
        if os.path.exists(accounting_path):
            print(f"✅ Accounting network path accessible: {accounting_path}")
            return True
        else:
            print(f"❌ Accounting network path not accessible: {accounting_path}")
            return False
    except Exception as e:
        print(f"❌ Accounting network access error: {e}")
        return False

def get_accessible_project_list_path():
    """Get accessible Project List path (network or local fallback)"""
    if is_network_enabled() and test_project_list_access():
        return get_project_list_path()
    else:
        # Fallback to local path
        local_path = os.path.join(os.path.dirname(__file__), 'data', NETWORK_CONFIG['project_list_file'])
        print(f"Using local fallback path: {local_path}")
        return local_path

if __name__ == "__main__":
    print("=== Network Configuration Test ===")
    print(f"Network enabled: {is_network_enabled()}")
    
    print("\n--- Testing Projects Access ---")
    test_network_access()
    
    print("\n--- Testing Project List Access ---")
    test_project_list_access()
    
    print("\n--- Testing Accounting Network Access ---")
    test_accounting_network_access()
    
    print("\n--- Accessible Paths ---")
    print(f"Projects folder: {get_network_path()}")
    print(f"Project List: {get_accessible_project_list_path()}")
    print(f"Accounting network: {get_accounting_network_path()}") 