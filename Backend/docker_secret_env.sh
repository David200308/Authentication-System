printf '' | docker secret create mysql_root_password -
docker secret create jwt_private_key private_key.pem
docker secret create jwt_public_key public_key.pem
printf '' | docker secret create docs_user -
printf '' | docker secret create docs_password -
printf '' | docker secret create passkey_rpname -
printf '' | docker secret create passkey_rpid -
printf '' | docker secret create passkey_origin -
printf '' | docker secret create aes_key -
printf '' | docker secret create mailgun_api_key -
printf '' | docker secret create mailgun_from_domain -
printf '' | docker secret create sentry_dsn -
