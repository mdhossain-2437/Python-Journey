# LLModel-Forge 🔥

<div align="center">

![LLModel-Forge](https://img.shields.io/badge/LLModel--Forge-ML%20Platform-blue?style=for-the-badge&logo=pytorch)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**Enterprise MLOps Platform for Training, Managing, and Deploying Machine Learning Models at Scale**

[Features](#features) • [Quick Start](#quick-start) • [Docker Deployment](#docker-deployment) • [API Reference](#api-reference) • [Contributing](#contributing)

</div>

---

## 🚀 Overview

LLModel-Forge is a production-ready MLOps platform that streamlines the entire machine learning lifecycle. From data labeling and feature engineering to experiment tracking, model deployment, and real-time monitoring—LLModel-Forge provides everything ML teams need to ship models faster and more reliably.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with secure token management
- User registration and login
- Protected API routes
- API key management for programmatic access

### 📊 Dashboard & Monitoring
- Real-time system health monitoring
- Live metrics with WebSocket updates
- Model performance KPIs
- Inference volume and latency tracking
- Data drift detection and alerts

### 📦 Model Registry
- Centralized model versioning
- Stage management (Development → Staging → Production)
- Model metrics tracking (Accuracy, F1, Latency)
- One-click model promotion/deployment
- Model file upload/download with S3-compatible storage

### 🔄 ML Pipelines
- Visual pipeline orchestration
- Step-by-step execution monitoring
- Real-time status updates via WebSocket
- Pipeline scheduling (Manual, Scheduled, Event-based)
- Automatic alerts on completion/failure

### 🗄️ Feature Store
- Centralized feature management
- Feature versioning and lineage
- Online/offline feature serving
- Feature discovery and reuse
- Statistical insights

### 🧪 Experiment Tracking
- Comprehensive experiment logging
- Hyperparameter tracking
- Real-time training progress
- Model comparison
- Artifact management

### 🏷️ Data Labeling
- Interactive labeling interface
- Multi-class classification
- Quality assurance workflows
- Progress tracking

### 🎯 Score Simulator
- Real-time model inference testing
- What-if analysis
- Feature importance visualization
- Risk assessment

### 🔔 Alerts & Notifications
- Real-time alerts via WebSocket
- Email notifications (SMTP)
- Model drift alerts
- Pipeline status notifications
- Customizable notification preferences

### ⚙️ Settings & Integrations
- User profile management
- Notification preferences
- API key management
- GitHub, Slack, AWS integrations

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS, Shadcn/UI
- **State:** TanStack Query (React Query)
- **Charts:** Recharts
- **Routing:** Wouter
- **Real-time:** WebSocket hooks

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js with TypeScript
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **ORM:** Drizzle ORM

### Infrastructure
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **File Storage:** MinIO (S3-compatible)
- **Container:** Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Development Setup

```bash
# Clone the repository
git clone https://github.com/mdhossain-2437/Python-Journey.git
cd Python-Journey/Projects/LLModel-Forge

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Demo Credentials
```
Username: demo
Password: demo123
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Start all services (App, PostgreSQL, Redis, MinIO)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Services Included
| Service | Port | Description |
|---------|------|-------------|
| App | 5000 | Main application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & real-time |
| MinIO | 9000/9001 | S3-compatible storage |

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/llmforge

# Authentication
JWT_SECRET=your-secret-key

# File Storage (MinIO/S3)
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=llmforge
MINIO_SECRET_KEY=llmforge123

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📡 API Reference

### Authentication
```bash
POST /api/auth/register   # Register new user
POST /api/auth/login      # Login
POST /api/auth/logout     # Logout
GET  /api/auth/me         # Get current user
```

### Models
```bash
GET    /api/models        # List all models
GET    /api/models/:id    # Get model by ID
POST   /api/models        # Create model
PATCH  /api/models/:id    # Update model
DELETE /api/models/:id    # Delete model
POST   /api/models/:id/promote     # Promote to stage
POST   /api/models/:id/upload      # Upload model file
GET    /api/models/:id/download    # Download model file
```

### Experiments
```bash
GET    /api/experiments       # List experiments
POST   /api/experiments       # Create experiment
PATCH  /api/experiments/:id   # Update experiment
POST   /api/experiments/:id/stop  # Stop experiment
```

### Pipelines
```bash
GET    /api/pipelines         # List pipelines
POST   /api/pipelines         # Create pipeline
POST   /api/pipelines/:id/run   # Run pipeline
POST   /api/pipelines/:id/stop  # Stop pipeline
```

### Predictions
```bash
POST   /api/predict           # Run inference
GET    /api/predictions       # Get prediction history
```

### WebSocket
```javascript
// Connect with token
const ws = new WebSocket(`ws://localhost:5000/ws?token=${token}`);

// Subscribe to channels
ws.send(JSON.stringify({ type: "subscribe", channel: "pipeline:abc123" }));

// Receive real-time updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data); // { type: "broadcast", channel: "...", data: {...} }
};
```

## 📁 Project Structure

```
LLModel-Forge/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks (auth, api, websocket)
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                 # Backend Express application
│   ├── auth.ts            # JWT authentication
│   ├── routes.ts          # API routes
│   ├── storage.ts         # In-memory storage
│   ├── postgres-storage.ts # PostgreSQL storage
│   ├── websocket.ts       # WebSocket service
│   ├── email.ts           # Email notifications
│   └── file-storage.ts    # S3/MinIO integration
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Drizzle ORM schema
├── migrations/             # Database migrations
├── docker-compose.yml      # Docker services
├── Dockerfile             # Production build
└── .env.example           # Environment template
```

## 🗺️ Roadmap

- [x] Authentication system
- [x] Model Registry with versioning
- [x] Pipeline orchestration
- [x] Real-time WebSocket updates
- [x] File storage (S3/MinIO)
- [x] Email notifications
- [x] Docker deployment
- [x] Alerts & Monitoring
- [ ] OAuth integration (GitHub, Google)
- [ ] Kubernetes deployment
- [ ] Model A/B testing
- [ ] Automated retraining triggers
- [ ] Multi-tenancy support

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details.

---

<div align="center">
Built with ❤️ for the ML community
</div>
