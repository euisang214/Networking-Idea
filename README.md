# MentorConnect

MentorConnect is a web platform that connects prospective candidates with anonymized industry professionals for paid virtual networking sessions and referral-based rewards.

## Features

- **Virtual Networking Sessions**: Connect with industry professionals through Zoom meetings
- **Anonymized Professionals**: Professionals can maintain anonymity while sharing insights
- **Secure Payments**: Payments are held on Stripe and released to professionals only after the session has been verified
- **Referral System**: Professionals can refer candidates to colleagues and earn rewards
- **Email Integration**: Automatically tracks and verifies referral emails
- **GDPR Compliance**: Users can delete their data via `/api/users/me/delete`
- **Observability**: Exposes `/metrics` endpoint and streams logs to Loki
- **Rate Limiting**: Built-in middleware protects API endpoints from abuse

## Technologies

- **Frontend**: React, Tailwind CSS, Stripe.js
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Integrations**: Zoom API, Stripe, SendGrid

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

