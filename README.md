# MentorConnect

MentorConnect is a web platform that connects prospective candidates with industry professionals for paid virtual networking sessions and referral-based rewards.

## Features

- **Virtual Networking Sessions**: Connect with industry professionals through Zoom meetings
- **Industry Professionals**: Connect directly with experienced professionals without anonymity
- **Secure Payments**: Payments are held on Stripe and released to professionals only after the session has been verified
- **Referral System**: Professionals can refer candidates to colleagues and earn rewards
- **Email Integration**: Automatically tracks and verifies referral emails, and sends session confirmations using SendGrid
- **Google Sign-In**: Users can sign up with Google and share calendar availability
- **GDPR Compliance**: Users can delete their data via `/api/users/me/delete`
- **Observability**: Exposes `/metrics` endpoint and streams logs to Loki
- **Rate Limiting**: Built-in middleware protects API endpoints from abuse

## Technologies

- **Frontend**: React, Tailwind CSS, Stripe.js
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Integrations**: Zoom API, Stripe, SendGrid, Google Calendar

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
3. Edit `.env` with your own credentials for MongoDB, Stripe, SendGrid, Zoom, Google OAuth and other keys. These variables are used by both the backend and frontend services. Set `MOCK_INTEGRATIONS=true` if you want to run the app without contacting the real external services.
   When this flag is enabled, MongoDB will automatically import the JSON files under `mock-data/` the first time the stack is started.
4. **Option A: Docker Compose (recommended)**
   1. Ensure Docker is running.
   2. Start the stack (set `API_PORT` in `.env` if port 5000 is already in use):
      ```bash
      docker compose up --build
      ```
   3. Open `http://localhost:3000` in your browser. The React app will talk to the API at `http://localhost:${API_PORT:-8000}`.
   4. When you're done, stop the stack:
      ```bash
      docker compose down
      ```
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

### Production Deployment

1. Edit `.env` and set `NODE_ENV=production`. Update the remaining values with
   your production database connection and service credentials.
2. Build the optimized frontend assets:
   ```bash
   npm run build
   ```
3. Start the services in detached mode:
   ```bash
   docker compose up --build -d
   ```
   Nginx will proxy the API and serve the frontend on ports `80` (and `443` if
   certificates are configured under `certbot/`).
4. To stop the production stack:
   ```bash
   docker compose down
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

