# CloudFront CDN Distribution
resource "aws_cloudfront_distribution" "cdn" {
  enabled = true
  comment = "Virtual Furniture Store CDN"
}
