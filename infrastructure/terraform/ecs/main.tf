# ECS Cluster & Services
resource "aws_ecs_cluster" "app_cluster" {
  name = "virtual-furniture-store-cluster"
}
