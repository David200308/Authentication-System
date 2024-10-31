variable "gcp_project_id" {
  description = "The GCP project ID"
}

variable "gcp_region" {
  description = "The GCP region"
}

variable "gcp_svc_key" {
  description = "The path to the GCP service account key"
}

variable "secret_db_host" {}
variable "secret_db_user" {}
variable "secret_db_pass" {}
variable "secret_db_name" {}
variable "secret_jwt_private_key" {}
variable "secret_jwt_public_key" {}
variable "secret_docs_user" {}
variable "secret_docs_password" {}
variable "secret_passkey_rpname" {}
variable "secret_passkey_rpid" {}
variable "secret_passkey_origin" {}
variable "secret_aes_key" {}
variable "secret_mailgun_api_key" {}
variable "secret_mailgun_from_domain" {}
