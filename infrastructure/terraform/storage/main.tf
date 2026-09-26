# S3 Buckets for 3D Models and Private User Room Imagery
resource "aws_s3_bucket" "furniture_assets" {
  bucket = "virtual-furniture-store-assets"
}

resource "aws_s3_bucket" "private_room_images" {
  bucket = "virtual-furniture-store-private-rooms"
}
