# MentorConnect

MentorConnect is a web platform that connects prospective candidates with anonymized industry professionals for paid virtual networking sessions and referral-based rewards.

## Features

- **Virtual Networking Sessions**: Connect with industry professionals through Zoom meetings
- **Anonymized Professionals**: Professionals can maintain anonymity while sharing insights
- **Secure Payments**: Payments are processed only after verified sessions via Zoom
- **Referral System**: Professionals can refer candidates to colleagues and earn rewards
- **Email Integration**: Automatically tracks and verifies referral emails

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