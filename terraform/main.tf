provider "aws" {
  region = var.aws_region
}

data "aws_default_vpc" "default" {}

data "aws_subnet_ids" "default" {
  vpc_id = data.aws_default_vpc.default.id
}

resource "aws_security_group" "db" {
  name   = "mentor-db"
  vpc_id = data.aws_default_vpc.default.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "mentor-db"
  subnet_ids = data.aws_subnet_ids.default.ids
}

resource "aws_rds_cluster" "mentor_connect" {
  engine                  = "aurora-postgresql"
  engine_version          = "13.7"
  cluster_identifier      = "mentor-connect"
  master_username         = var.db_user
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.db.id]
}

resource "aws_rds_cluster_instance" "mentor_connect" {
  count              = var.db_instance_count
  identifier         = "mentor-connect-${count.index}"
  cluster_identifier = aws_rds_cluster.mentor_connect.id
  instance_class     = var.db_instance_class
}

resource "aws_ecs_cluster" "mentor" {
  name = "mentor-connect"
}
