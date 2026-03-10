# WealthBeing

WealthBeing is a **Wealth Wellness Hub** built to function as a financial health dashboard themed entirely around a medical check-up, providing a unique way for users to monitor their financial well-being.

## Project Overview

The application computes a single **Wealth Wellness Score (WWS)** on a scale of 0–1000. This score functions similarly to a patient's health score and is broken down into financial "vitals" such as diversification, liquidity, behavioral resilience, savings rate, and debt health.

### Key Concepts

* **Vitals**: Financial metrics analyzed through pillar algorithms.
* **Prescription (Rx)**: Specific, AI-generated action recommendations based on the user's data.
* **Treatment Plan**: A scenario sandbox for modeling interventions and viewing projections.
* **Clinical View**: An adviser persona mode that allows for detailed observation and clinical notes.

## Tech Stack

### Frontend

* **Framework**: React 18 with Vite
* **Styling**: Tailwind CSS and Framer Motion for animations
* **Charts**: Recharts for radar, line, bar, and area visualizations
* **State Management**: Zustand (global state) and React Query (server state)

### Backend

The backend is built using five Python FastAPI microservices:

* **API Gateway**: Public entry point for routing and dashboard aggregation.
* **Portfolio Service**: Serves mock portfolio data.
* **Scoring Engine**: Computes the WWS using specialized pillar algorithms.
* **Simulation Service**: Handles Monte Carlo and deterministic sandbox simulations.
* **Adviser Service**: Proxy for AI prompt construction and insights.

## Architecture

The system utilizes a microservices architecture coordinated via a central gateway. The gateway's `GET /api/dashboard` endpoint calls the Portfolio Service and Scoring Engine in parallel using `asyncio.gather` to merge responses into a single payload for the frontend.

## Getting Started

### Local Development

1. **Backend**:
* Navigate to the `backend` directory.
* Configure your `.env` file with an `ANTHROPIC_API_KEY`.
* Run `docker-compose up --build` to start all five services.


2. **Frontend**:
* Navigate to the `frontend` directory.
* Install dependencies with `npm install`.
* Start the development server with `npm run dev`.
