output "region_id" {
  value       = "${var.region}"
}

output "zone_id" {
  value       = "${var.availability_zone}"
}

output "vpc_id" {
  description = "The ID of the VPC."
  value       = "${alicloud_vpc.vpc.0.id}"
}

output "vswitch_id" {
  description = "The ID of the VSwitch."
  value       = "${alicloud_vswitch.vsw.0.id}"
}

output "securitygroup_id" {
  description = "The ID of the SecurityGroup."
  value       = "${alicloud_security_group.sg.0.id}"
}

output "eip_id" {
  description = "The ID of the EIP."
  value       = "${alicloud_eip.default.0.id}"
}

output "eip_ip" {
  description = "The IP of the EIP."
  value       = "${alicloud_eip.default.0.ip_address}"
}