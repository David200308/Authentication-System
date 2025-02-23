# Authentication System

## Authentication Methods

- Password Authentication
- Email Verification
- 2FA (TOTP) (Optional)
- Token Authentication (JWT Token - ES256 Algorithm)
- QR Code Authentication
- Notification Authentication
- Passkey Authentication

## Tech Stack

- Frontend: Remix + React (TypeScript)
- Backend: NestJS (TypeScript)
- Database: MySQL
- Cache Database: Redis
- Container: Docker
- Deployment: Frontend (Vercel) + Backend (Linux Cloud Server)
- Email Service: Mailgun (https://www.mailgun.com/)
- Error Tracking: Sentry (https://sentry.io/)

## ES256 JWT Signing Key Pair Generate

Generate the ECDSA key pairs with prime256v1 curve

```
openssl ecparam -name prime256v1 -genkey -noout -out private_key.pem
openssl ec -in private_key.pem -pubout -out public_key.pem
```

## Database AES Key Generate

```
head /dev/urandom | sha256sum
```

## Running the Frontend

```bash
cd Frontend

## Install the package
npm install

## Running on develop mode
npm run dev

## Only build the static files
npm run build

## Build and Run
npm run build && npm run start
```

## Running the Backend & Database Setup

```bash
cd Backend

## Use `sudo mysql -u <USER> -p` get into the MySQL Console and do this
source ./database.sql

## Manual Start of the backend
npm run start

## Also, can running on docker
docker-compose up -d

# .env file: if use docker container for Backend API & the Database host at local -> use "host.docker.internal"
#
# Windows & MacOS: 
#     - just add to dotenv file
#
# Linux:
#     - a) under /etc/mysql/mysql.conf.d/, mysql.cnf is a blank file; mysqld.cnf had bind-address and mysqlx-bind-address both = 127.0.0.1, I changed only the bind-address to 127.0.0.1,host.docker.internal thensystemctl restart mysql
#     - b) added an entry 172.17.0.1 host.docker.internal to /etc/hosts before
#     - c) CREATE USER 'backend'@'%' IDENTIFIED BY '<password>';
#     - d) GRANT ALL PRIVILEGES ON BACKEND.* to 'backend'@'%';
#
# Case for Linux Solution souce: https://forums.docker.com/t/nodejs-docker-container-cant-connect-to-mysql-on-host/115221/6
# Thanks @drakeorfeo & @matthiasradde
```

## Backend Docker Deployment (Current Used)

```bash
## On Local Machine

cd Backend
docker context create auth-system --docker "host=ssh://root@<SERVER_IP_ADDRESS>"
docker context list
docker context use auth-system
docker swarm init
./docker_secret_env.sh ## Need to fill in the secret !

## On Server
docker pull <DOCKER_IMAGE_URL_BUILD_BY_GITHUB_ACTION>

## On Local Machine
docker stack deploy -c docker-compose.yml auth-system-backend
```

## Build Backend Docker Image & Push to Cloud (On other Cloud Platforms)

```bash
## Build Docker Image
docker build -t auth-system .

## Push to DigitalOcean
## Require: Docker, doctl CLI
docker tag auth-system registry.digitalocean.com/<ACCOUNT>/auth-system
docker push registry.digitalocean.com/<ACCOUNT>/auth-system

## Push to Google Cloud
## Require: Docker, gcloud CLI
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://<LOCATION>-docker.pkg.dev
gcloud artifacts repositories create backend --repository-format=docker \
    --location=<LOCATION> --description="Backend Docker Image" \
    --project=<PROJECT_ID>
docker tag auth-system <LOCATION>-docker.pkg.dev/<PROJECT_ID>/backend/auth-system
docker push <LOCATION>-docker.pkg.dev/<PROJECT_ID>/backend/auth-system

```
