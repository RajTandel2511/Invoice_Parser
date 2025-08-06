# Network Configuration Guide

## Overview
The invoice processing pipeline can work with both network and local file systems. This guide explains how to configure the network settings.

## Quick Setup

### 1. Edit Network Configuration
Open `network_config.py` and modify the settings:

```python
NETWORK_CONFIG = {
    # Server IP or hostname
    "projects_server": "192.168.1.130",
    
    # Network share name
    "projects_share": "Projects",
    
    # Folder name on the share
    "projects_folder": "Raj",
    
    # Enable/disable network access
    "enable_network": True,
    
    # Local fallback directory
    "local_fallback": "data/network_fallback/"
}
```

### 2. Network Path Format
The script automatically constructs the network path as:
```
\\{projects_server}\{projects_share}\{projects_folder}\
```

Example: `\\192.168.1.130\Projects\Raj\`

### 3. Testing Network Connectivity
The script will automatically:
- Try to access the network path first
- Fall back to local directory if network is unavailable
- Create sample files in local fallback for testing

## Configuration Options

### Option 1: Network Mode (Default)
```python
NETWORK_CONFIG = {
    "projects_server": "192.168.1.130",
    "projects_share": "Projects", 
    "projects_folder": "Raj",
    "enable_network": True,
    "local_fallback": "data/network_fallback/"
}
```

### Option 2: Local-Only Mode
```python
NETWORK_CONFIG = {
    "projects_server": "localhost",
    "projects_share": "local",
    "projects_folder": "test", 
    "enable_network": False,  # Disable network
    "local_fallback": "data/network_fallback/"
}
```

### Option 3: Different Network Server
```python
NETWORK_CONFIG = {
    "projects_server": "192.168.1.100",  # Different server
    "projects_share": "Shared",           # Different share
    "projects_folder": "Invoices",        # Different folder
    "enable_network": True,
    "local_fallback": "data/network_fallback/"
}
```

## Troubleshooting

### Network Path Not Accessible
1. Check if the server is reachable: `ping 192.168.1.130`
2. Verify the share name exists
3. Ensure you have permissions to access the folder
4. Try mapping the network drive manually first

### Local Fallback Issues
1. The script automatically creates `data/network_fallback/` directory
2. Sample files are created for testing when network is unavailable
3. Check file permissions in the local directory

### Forcing Local Mode
Set `"enable_network": False` in `network_config.py` to force local mode regardless of network availability.

## File Structure
```
process/
├── network_config.py          # Network configuration
├── notebooks/
│   └── invoice_pipeline_combined.py  # Main script
├── data/
│   └── network_fallback/      # Local fallback directory
└── README_NETWORK_SETUP.md    # This file
```

## Running the Script
The script will automatically detect network availability and provide appropriate feedback:

```
✅ Loaded network configuration from network_config.py
✅ Using network path: \\192.168.1.130\Projects\Raj\
```

Or if network is unavailable:

```
⚠️ Network path not accessible, using local fallback: data/network_fallback/
📄 Created sample file: data/network_fallback/PO_12345_sample.pdf
``` 