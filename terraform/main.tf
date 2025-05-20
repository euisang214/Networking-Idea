provider "aws" {
  region = var.aws_region
}

resource "aws_rds_cluster" "mentor_connect" {
  engine            = "aurora-postgresql"
  engine_version    = "13.7"
  cluster_identifier = "mentor-connect"
  master_username   = var.db_user
  master_password   = var.db_password
}

resource "aws_ecs_cluster" "mentor" {
  name = "mentor-connect"
}
