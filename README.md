# COMP4334 Team 4 Project: Authorization System

## Authentication Methods

- Password Authentication
- Token Authentication (JWT Token - ES256 Algorithm)
- QR Code Authentication
- Notification Authentication

## Tech Stack

- Frontend: Remix + React (TypeScript)
- Backend: NestJS + TypeScript
- Database: MySQL
- Container: Docker

## ES256 JWT Signing Key Pair Generate

Generate the ECDSA key pairs with secp256k1 curve

```
openssl ecparam -name secp256k1 -genkey -noout -out private_key.pem
openssl ec -in private_key.pem -pubout > public_key.pem
```
