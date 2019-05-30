variable "number_format" {
  description = "The number format used to output."
  default     = "%02d"
}

variable "vpc_name" {
  default = "spine-app"
}

variable "vpc_cidr" {
  default = "172.16.0.0/12"
}

variable "vswitch_cidr" {
  default = "172.16.0.0/21"
}

variable "region" {
  default = "cn-hangzhou"
}

variable "availability_zone" {
  default = "cn-hangzhou-b"
}

variable "sg_name" {
  default = "spine-app"
}
