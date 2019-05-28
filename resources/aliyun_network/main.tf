provider "alicloud" {
  region     = "${var.region}"
}

resource "alicloud_vpc" "vpc" {
  name       = "${format("%s-%s", var.vpc_name, format(var.number_format, count.index+1))}"
  cidr_block = "${var.vpc_cidr}"
}

resource "alicloud_vswitch" "vsw" {
  vpc_id            = "${alicloud_vpc.vpc.id}"
  cidr_block        = "${var.vswitch_cidr}"
  availability_zone = "${var.availability_zone}"
}

resource "alicloud_security_group" "sg" {
  name   = "${format("%s-%s", var.sg_name, format(var.number_format, count.index+1))}"
  vpc_id = "${alicloud_vpc.vpc.id}"
}

resource "alicloud_security_group_rule" "in-all" {
  type              = "ingress"
  ip_protocol       = "all"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "-1/-1"
  priority          = 1
  security_group_id = "${alicloud_security_group.sg.id}"
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_security_group_rule" "en-all" {
  type              = "egress"
  ip_protocol       = "all"
  nic_type          = "intranet"
  policy            = "accept"
  port_range        = "-1/-1"
  priority          = 1
  security_group_id = "${alicloud_security_group.sg.id}"
  cidr_ip           = "0.0.0.0/0"
}

resource "alicloud_eip" "default" {
  internet_charge_type = "PayByTraffic"
}