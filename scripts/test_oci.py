#!/usr/bin/env python3
"""Quick OCI connectivity test."""

import oci
from pathlib import Path

config = oci.config.from_file("C:/Users/rajat/.oci/config", "DEFAULT")
config["region"] = "ap-hyderabad-1"

identity = oci.identity.IdentityClient(config)
compute = oci.core.ComputeClient(config)

tenancy_id = "ocid1.tenancy.oc1..aaaaaaaam5lfbp27eooqtiqm64dowyjlpsjpkzer4etknfyo6h2v5jrf4k4a"

print("=== OCI Connection Test ===\n")

# Get ADs
ads = identity.list_availability_domains(compartment_id=tenancy_id).data
print(f"Availability domains: {[ad.name for ad in ads]}")

# Get Ubuntu image
images = compute.list_images(
    compartment_id=tenancy_id,
    operating_system="Canonical Ubuntu",
    operating_system_version="22.04 Minimal aarch64",
    shape="VM.Standard.A1.Flex",
    sort_by="TIMECREATED",
    sort_order="DESC",
    limit=1
).data
if images:
    print(f"Ubuntu image: {images[0].display_name}")
    print(f"Image ID: {images[0].id}")
else:
    print("Ubuntu image: Not found")

# Check SSH key
ssh_path = Path.home() / ".ssh" / "oci_portfolio_key.pub"
if ssh_path.exists():
    print(f"SSH key: Found at {ssh_path}")
else:
    ssh_path = Path.home() / ".ssh" / "id_rsa.pub"
    if ssh_path.exists():
        print(f"SSH key: Found at {ssh_path}")
    else:
        print("SSH key: NOT FOUND!")

# Check existing VCN
network = oci.core.VirtualNetworkClient(config)
vcns = network.list_vcns(compartment_id=tenancy_id).data
print(f"\nExisting VCNs: {[v.display_name for v in vcns]}")

# Existing subnets
if vcns:
    subnets = network.list_subnets(compartment_id=tenancy_id, vcn_id=vcns[0].id).data
    print(f"Subnets in {vcns[0].display_name}: {[s.display_name for s in subnets]}")

print("\n=== Test Complete ===")
