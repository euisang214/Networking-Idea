variable "aws_region" {
  default = "us-east-1"
}

variable "db_user" {}
variable "db_password" {}

variable "db_instance_count" {
  description = "Number of RDS instances"
  default     = 1
}

variable "db_instance_class" {
  description = "Instance class for RDS nodes"
  default     = "db.t3.medium"
}
