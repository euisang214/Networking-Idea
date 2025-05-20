output "rds_cluster_endpoint" {
  value = aws_rds_cluster.mentor_connect.endpoint
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.mentor.name
}
