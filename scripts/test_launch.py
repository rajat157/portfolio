#!/usr/bin/env python3
"""Single test launch attempt."""

import oci
from pathlib import Path

config = oci.config.from_file("C:/Users/rajat/.oci/config", "DEFAULT")
config["region"] = "ap-hyderabad-1"

compute = oci.core.ComputeClient(config)
network = oci.core.VirtualNetworkClient(config)
identity = oci.identity.IdentityClient(config)

TENANCY_ID = "ocid1.tenancy.oc1..aaaaaaaam5lfbp27eooqtiqm64dowyjlpsjpkzer4etknfyo6h2v5jrf4k4a"

# Get image
images = compute.list_images(
    compartment_id=TENANCY_ID,
    operating_system="Canonical Ubuntu",
    operating_system_version="22.04 Minimal aarch64",
    shape="VM.Standard.A1.Flex",
    limit=1
).data
image_id = images[0].id
print(f"Image: {images[0].display_name}")

# Get subnet
vcns = network.list_vcns(compartment_id=TENANCY_ID).data
vcn = [v for v in vcns if "portfolio" in v.display_name.lower()][0]
subnets = network.list_subnets(compartment_id=TENANCY_ID, vcn_id=vcn.id).data
subnet_id = subnets[0].id
print(f"Subnet: {subnets[0].display_name}")

# SSH key
ssh_key = Path.home().joinpath(".ssh", "oci_portfolio_key.pub").read_text().strip()
print(f"SSH key loaded ({len(ssh_key)} chars)")

# AD
ads = identity.list_availability_domains(compartment_id=TENANCY_ID).data
ad = ads[0].name
print(f"AD: {ad}")

print(f"\nAttempting launch with 1 OCPU, 6GB RAM...")

try:
    response = compute.launch_instance(
        oci.core.models.LaunchInstanceDetails(
            compartment_id=TENANCY_ID,
            availability_domain=ad,
            display_name="portfolio-server",
            shape="VM.Standard.A1.Flex",
            shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
                ocpus=1.0,
                memory_in_gbs=6.0
            ),
            source_details=oci.core.models.InstanceSourceViaImageDetails(
                image_id=image_id,
                boot_volume_size_in_gbs=50
            ),
            create_vnic_details=oci.core.models.CreateVnicDetails(
                subnet_id=subnet_id,
                assign_public_ip=True
            ),
            metadata={"ssh_authorized_keys": ssh_key}
        )
    )
    print("\n🎉 SUCCESS!")
    print(f"Instance ID: {response.data.id}")
    print(f"State: {response.data.lifecycle_state}")
except oci.exceptions.ServiceError as e:
    print(f"\n❌ Error: {e.message}")
    if "Out of host capacity" in str(e):
        print("   -> This is normal, capacity is limited. Keep retrying!")
