#!/usr/bin/env python3
r"""
OCI Free Tier Instance Hunter v2
Multi-region, parallel attempts to snag an Always Free A1 instance.

Run with Oracle CLI's Python:
  C:\Users\rajat\lib\oracle-cli\Scripts\python.exe oci_hunt.py
"""

import sys
import io

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import oci
import time
import threading
import json
import os
import sys
from datetime import datetime
from pathlib import Path
import urllib.request
import urllib.parse

# ============== CONFIGURATION ==============

OCI_CONFIG_PATH = "C:/Users/rajat/.oci/config"
TENANCY_ID = "ocid1.tenancy.oc1..aaaaaaaam5lfbp27eooqtiqm64dowyjlpsjpkzer4etknfyo6h2v5jrf4k4a"

# Instance configuration - START SMALL for better chances!
INSTANCE_CONFIG = {
    "display_name": "portfolio-server",
    "shape": "VM.Standard.A1.Flex",
    "ocpus": 1,      # Can upgrade to 4 after getting instance
    "memory_gb": 6,  # Can upgrade to 24 after getting instance
    "boot_volume_gb": 50,
}

# OCI regions that support Always Free A1
# Ordered by typical capacity availability
FREE_TIER_REGIONS = [
    "ap-hyderabad-1",     # Your home region (required for always free)
    "ap-mumbai-1",        # India - close to you
    # Note: Always Free resources are ONLY available in your home region
    # Keeping only home region since that's where free tier works
]

# Retry configuration  
RETRY_INTERVAL = 30  # seconds between attempts
MAX_ATTEMPTS = 50000  # Keep trying!

# Telegram notification
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "7011095516")

STATE_FILE = Path(__file__).parent / "oci_hunt_state.json"

# ============== HELPERS ==============

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def send_telegram(message):
    if not TELEGRAM_BOT_TOKEN:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown"
        }).encode()
        urllib.request.urlopen(url, data, timeout=10)
    except Exception as e:
        log(f"Telegram failed: {e}", "WARN")


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"attempts": 0, "started_at": datetime.now().isoformat()}


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ============== OCI FUNCTIONS ==============

def get_config(region=None):
    config = oci.config.from_file(OCI_CONFIG_PATH, "DEFAULT")
    if region:
        config["region"] = region
    return config


def get_ubuntu_image(compute_client):
    """Find latest Ubuntu 22.04 Minimal aarch64 image."""
    images = compute_client.list_images(
        compartment_id=TENANCY_ID,
        operating_system="Canonical Ubuntu",
        operating_system_version="22.04 Minimal aarch64",
        shape="VM.Standard.A1.Flex",
        sort_by="TIMECREATED",
        sort_order="DESC",
        limit=1
    ).data
    return images[0].id if images else None


def get_existing_subnet(network_client):
    """Get existing portfolio subnet."""
    vcns = network_client.list_vcns(compartment_id=TENANCY_ID).data
    vcn = next((v for v in vcns if "portfolio" in v.display_name.lower()), None)
    
    if vcn:
        subnets = network_client.list_subnets(
            compartment_id=TENANCY_ID, 
            vcn_id=vcn.id
        ).data
        subnet = next((s for s in subnets if "public" in s.display_name.lower() or "portfolio" in s.display_name.lower()), None)
        if subnet:
            return subnet.id
    return None


def get_ssh_key():
    """Read SSH public key."""
    paths = [
        Path.home() / ".ssh" / "oci_portfolio_key.pub",
        Path.home() / ".ssh" / "id_rsa.pub",
    ]
    for p in paths:
        if p.exists():
            return p.read_text().strip()
    return None


def try_launch(region="ap-hyderabad-1"):
    """Attempt to launch an instance."""
    try:
        config = get_config(region)
        compute = oci.core.ComputeClient(config)
        network = oci.core.VirtualNetworkClient(config)
        identity = oci.identity.IdentityClient(config)
        
        # Get prerequisites
        image_id = get_ubuntu_image(compute)
        subnet_id = get_existing_subnet(network)
        ssh_key = get_ssh_key()
        
        if not all([image_id, subnet_id, ssh_key]):
            missing = []
            if not image_id: missing.append("image")
            if not subnet_id: missing.append("subnet")
            if not ssh_key: missing.append("ssh_key")
            log(f"Missing: {missing}", "ERROR")
            return None
        
        # Get availability domains
        ads = identity.list_availability_domains(compartment_id=TENANCY_ID).data
        
        for ad in ads:
            log(f"Trying {region} / {ad.name}...")
            
            try:
                launch_details = oci.core.models.LaunchInstanceDetails(
                    compartment_id=TENANCY_ID,
                    availability_domain=ad.name,
                    display_name=INSTANCE_CONFIG["display_name"],
                    shape=INSTANCE_CONFIG["shape"],
                    shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
                        ocpus=float(INSTANCE_CONFIG["ocpus"]),
                        memory_in_gbs=float(INSTANCE_CONFIG["memory_gb"])
                    ),
                    source_details=oci.core.models.InstanceSourceViaImageDetails(
                        image_id=image_id,
                        boot_volume_size_in_gbs=INSTANCE_CONFIG["boot_volume_gb"]
                    ),
                    create_vnic_details=oci.core.models.CreateVnicDetails(
                        subnet_id=subnet_id,
                        assign_public_ip=True
                    ),
                    metadata={"ssh_authorized_keys": ssh_key}
                )
                
                response = compute.launch_instance(launch_details)
                instance = response.data
                
                log(f"🎉 SUCCESS! Instance ID: {instance.id}", "SUCCESS")
                
                # Wait for public IP
                time.sleep(60)
                vnics = compute.list_vnic_attachments(
                    compartment_id=TENANCY_ID,
                    instance_id=instance.id
                ).data
                
                public_ip = None
                if vnics:
                    vnic = network.get_vnic(vnics[0].vnic_id).data
                    public_ip = vnic.public_ip
                
                msg = f"""🎉 *OCI Instance Created!*

*Region:* {region}
*ID:* `{instance.id}`
*Shape:* {INSTANCE_CONFIG['ocpus']} OCPU, {INSTANCE_CONFIG['memory_gb']}GB RAM
*IP:* `{public_ip or 'pending...'}`

SSH: `ssh ubuntu@{public_ip}`"""
                
                send_telegram(msg)
                log(f"Public IP: {public_ip}")
                
                return instance
                
            except oci.exceptions.ServiceError as e:
                if "Out of host capacity" in str(e):
                    log(f"Out of capacity in {ad.name}")
                elif "LimitExceeded" in str(e):
                    log(f"Limit exceeded - you may already have an instance", "ERROR")
                    return None
                else:
                    log(f"OCI Error: {e.message}", "ERROR")
                    
    except Exception as e:
        log(f"Exception: {e}", "ERROR")
    
    return None


# ============== MAIN ==============

def hunt():
    """Main hunting loop."""
    log("=" * 50)
    log("OCI Free Tier Instance Hunter v2")
    log("=" * 50)
    log(f"Shape: {INSTANCE_CONFIG['shape']} ({INSTANCE_CONFIG['ocpus']} OCPU, {INSTANCE_CONFIG['memory_gb']}GB)")
    log(f"Region: ap-hyderabad-1 (home region for free tier)")
    log(f"Retry interval: {RETRY_INTERVAL}s")
    log("Press Ctrl+C to stop")
    log("")
    
    state = load_state()
    
    try:
        while state["attempts"] < MAX_ATTEMPTS:
            state["attempts"] += 1
            log(f"--- Attempt #{state['attempts']} ---")
            
            result = try_launch("ap-hyderabad-1")
            
            if result:
                state["success"] = True
                state["instance_id"] = result.id
                save_state(state)
                log("Instance created! Stopping hunt.")
                return result
            
            save_state(state)
            log(f"Waiting {RETRY_INTERVAL}s before next attempt...")
            time.sleep(RETRY_INTERVAL)
            
    except KeyboardInterrupt:
        log("\nStopped by user (Ctrl+C)")
        save_state(state)
    
    return None


if __name__ == "__main__":
    hunt()
