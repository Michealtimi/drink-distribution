# Beverage Distribution Operations Platform

An operations-focused application for beverage distribution teams. It brings lead management, customer records, order tracking, payment records, delivery planning, and follow-up workflows into one workspace.

## Product workflows

- Lead capture, import, validation, and prospect management
- Customer records and relationship history
- Order creation and order-status tracking
- Payment recording and outstanding-payment visibility
- Delivery planning and route-oriented workflows
- Follow-up scheduling and operational reminders
- Basic operational analytics
- WhatsApp-assisted communication workflows

Communication automation should be used with appropriate customer consent and in line with WhatsApp policies. The application is not intended for unsolicited bulk messaging.

## Technology

- Next.js 14 and React
- TypeScript
- PostgreSQL and Prisma
- Zod
- Playwright
- Scheduled jobs
- WhatsApp Web integration

## Local development

### Prerequisites

- Node.js compatible with the project
- pnpm
- PostgreSQL
- Chromium/Playwright browser dependencies where browser automation is used

### Setup

```bash
git clone https://github.com/Michealtimi/drink-distribution.git
cd drink-distribution
pnpm install
cp .env.example .env
npx prisma generate
npx prisma db push
pnpm dev
```

Set the required environment variables in `.env` before running the application. Keep database credentials, session data, API keys, and scheduled-job secrets out of version control.

## Before deploying

Review authentication and authorization on every API route, ensure scheduled jobs fail closed when their secret is absent, apply rate limits to sensitive endpoints, and validate all external input. Scraping and browser automation must respect target-site terms, privacy requirements, and applicable law. Protect WhatsApp session data and obtain appropriate consent before contacting customers.

## Project status

This repository demonstrates an operations workflow and its implementation. Review the current code, environment configuration, and security controls before using it with real customer or payment data.
