# MentorConnect

MentorConnect is a web platform that connects prospective candidates with anonymized industry professionals for paid virtual networking sessions and referral-based rewards.

## Features

- **Virtual Networking Sessions**: Connect with industry professionals through Zoom meetings
- **Anonymized Professionals**: Professionals can maintain anonymity while sharing insights
- **Secure Payments**: Payments are held on Stripe and released to professionals only after the session has been verified
- **Referral System**: Professionals can refer candidates to colleagues and earn rewards
- **Email Integration**: Automatically tracks and verifies referral emails, and sends session confirmations using SendGrid
- **GDPR Compliance**: Users can delete their data via `/api/users/me/delete`
- **Observability**: Exposes `/metrics` endpoint and streams logs to Loki
- **Rate Limiting**: Built-in middleware protects API endpoints from abuse

## Technologies

- **Frontend**: React, Tailwind CSS, Stripe.js
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Integrations**: Zoom API, Stripe, SendGrid

## Authentication & Authorization

The API secures endpoints with JSON Web Tokens (JWT). Clients obtain a token by
calling `/auth/login` and must send it in the `Authorization: Bearer <token>`
header on subsequent requests. Tokens are signed using the `JWT_SECRET`
environment variable and expire based on `JWT_EXPIRES_IN`.

Role‑based access control is implemented via the `rolesAllowed` middleware. The
token payload includes the user’s `userType`, allowing routes to restrict
access to specific roles (e.g. `candidate`, `professional`, `admin`).

## Key Business Rules

1. Professional is only paid once a coffee chat has occurred (verified via Zoom listener APIs)
2. Referral payouts are triggered only if:
   - The professional sends an email referring the candidate to a colleague with the same email domain
   - The platform is CC'd on the email (allowing mapping between the professional and candidate)

## Installation

### Prerequisites

- Node.js (v14+)
- MongoDB
- Docker and Docker Compose (for containerized setup)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Networking-Idea
   ```
2. Copy the example environment variables:
   ```bash
   cp env-example.txt .env
   ```
3. Edit `.env` with your own credentials for MongoDB, Stripe, SendGrid, Zoom and other keys. These variables are used by both the backend and frontend services. Set `MOCK_INTEGRATIONS=true` if you want to run the app without contacting the real external services.
4. **Option A: Docker Compose (recommended)**
   1. Ensure Docker is running.
   2. Start the stack:
      ```bash
      docker compose up --build
      ```
   3. The frontend will be available at `http://localhost:3000` and the API at `http://localhost:5000`.
5. **Option B: Run services manually**
   1. Install frontend dependencies:
      ```bash
      npm install
      ```
   2. Start MongoDB locally and set the connection string in `.env`.
   3. Install backend dependencies and start the API server:
      ```bash
      cd backend
      npm install
      npm start
      ```
   4. In a separate terminal start the frontend:
      ```bash
      npm start
      ```
6. Run unit tests (optional):
   ```bash
  npm test
  ```

### Infrastructure

Terraform files are provided in the `terraform/` directory for deploying the
platform on AWS with RDS and ECS. These are reference modules and may require
additional configuration before use.

## Error Handling & Logging

The backend uses a centralized error handling system based on custom error
classes found in `backend/utils/errorTypes.js`. All API routes forward errors to
`backend/middlewares/errorHandler.js`, ensuring consistent JSON responses and
proper HTTP status codes. The `logger` utility (`backend/utils/logger.js`) writes
structured logs to files in `backend/logs/` and, when the `LOKI_URL`
environment variable is set, also streams logs to Loki. Incoming requests are
captured by `logger.requestLogger`, and unexpected exceptions are recorded by
`logger.errorLogger`.

To view local logs, check the `backend/logs` directory. In production, configure
`LOKI_URL` to ship logs to your Loki instance for centralized observability.

