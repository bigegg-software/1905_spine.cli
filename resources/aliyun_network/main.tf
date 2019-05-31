provider "alicloud" {
  region     = "${var.region}"
}

resource "alicloud_oss_bucket" "app_bucket" {
 bucket = "spine-dev-${var.app_name}"
 acl = "public-read"
}

resource "alicloud_ram_user" "ram_user" {
  name = "spine-dev-master-${var.app_name}"
  force = true
}

resource "alicloud_ram_access_key" "ak" {
  user_name = "${alicloud_ram_user.ram_user.name}"
  secret_file = "/tmp/secret.txt"
}

resource "alicloud_ram_policy" "app_policy" {
  name = "${alicloud_ram_user.ram_user.name}"
  statement = [
    {
      effect = "Allow"
      action = [
        "oss:ListObjects",
        "oss:GetObject",
        "oss:PutObject"]
      resource = [
        "acs:oss:*:*:${alicloud_oss_bucket.app_bucket.bucket}",
        "acs:oss:*:*:${alicloud_oss_bucket.app_bucket.bucket}/*"]
    }]
  force = true
}

resource "alicloud_ram_user_policy_attachment" "attach" {
  policy_name = "${alicloud_ram_policy.app_policy.name}"
  policy_type = "Custom"
  user_name = "${alicloud_ram_user.ram_user.name}"
}
resource "alicloud_vpc" "vpc" {
  name       = "${format("%s-%s", var.app_name, format(var.number_format, count.index+1))}"
  cidr_block = "${var.vpc_cidr}"
}

resource "alicloud_vswitch" "vsw" {
  vpc_id            = "${alicloud_vpc.vpc.id}"
  cidr_block        = "${var.vswitch_cidr}"
  availability_zone = "${var.availability_zone}"
}

resource "alicloud_security_group" "sg" {
  name   = "${format("%s-%s", var.app_name, format(var.number_format, count.index+1))}"
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
