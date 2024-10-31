resource "google_compute_network" "vpc_network" {
  project                 = var.gcp_project_id
  name                    = "${var.gcp_project_id}-default"
  auto_create_subnetworks = true
  routing_mode            = "REGIONAL"
  mtu                     = 1460
}

resource "google_vpc_access_connector" "connector" {
  name          = "backend-connector"
  network       = google_compute_network.vpc_network.self_link
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 1
  max_instances = 1
  machine_type  = "f1-micro"
}

output "vpc_gateway_ipv4" {
  value = google_compute_network.vpc_network.gateway_ipv4
}
