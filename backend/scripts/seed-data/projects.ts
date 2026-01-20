/**
 * Project seed data
 * Extracted from frontend/src/app/page.tsx and PROGRESS.md
 */

export interface ProjectSeed {
  title: string;
  slug: string;
  description: string;
  content: string;
  technologies: string[];
  categorySlug: string; // Reference to category
  featured: boolean;
  featured_order: number | null;
  live_url: string | null;
  github_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

export const projects: ProjectSeed[] = [
  {
    title: "Tredye Trading Platform",
    slug: "tredye-trading-platform",
    description:
      "Real-time trading platform built with Next.js 16, Docker, Redis, Kafka, and PostgreSQL. Features high-frequency data streaming, real-time order book updates, and advanced charting capabilities.",
    content: `
# Tredye Trading Platform

A comprehensive real-time trading platform designed for high-frequency trading operations.

## Key Features

- **Real-time Data Streaming**: WebSocket-based live price feeds with sub-millisecond latency
- **Order Book Management**: Live order book updates with depth visualization
- **Advanced Charting**: TradingView-style interactive charts with multiple timeframes
- **Portfolio Management**: Real-time P&L tracking and position management
- **Risk Management**: Configurable stop-loss, take-profit, and position limits

## Technical Architecture

The platform is built on a microservices architecture:

- **Frontend**: Next.js 16 with App Router for server-side rendering and optimal performance
- **Message Queue**: Apache Kafka for reliable, ordered event streaming
- **Cache Layer**: Redis for session management and real-time data caching
- **Database**: PostgreSQL with TimescaleDB extension for time-series data
- **Containerization**: Docker and Docker Compose for development and deployment

## Challenges & Solutions

### High-Frequency Updates
The main challenge was handling thousands of price updates per second without overwhelming the UI. We implemented a tick batching system that aggregates updates within a 16ms window (matching 60fps refresh rate) and uses React's concurrent features for smooth rendering.

### Data Consistency
Ensuring data consistency across distributed services was critical. We used Kafka's exactly-once semantics combined with PostgreSQL's ACID transactions to maintain order integrity.
    `.trim(),
    technologies: ["Next.js", "Docker", "Redis", "Kafka", "PostgreSQL", "WebSocket", "TypeScript"],
    categorySlug: "web-dev",
    featured: true,
    featured_order: 1,
    live_url: null,
    github_url: null,
    start_date: "2025-11-01",
    end_date: null,
  },
  {
    title: "Labbuild 2.0",
    slug: "labbuild-2",
    description:
      "High-performance lab infrastructure system achieving 90% faster performance compared to the previous version. Built with Python, Flask, FastAPI, and MongoDB.",
    content: `
# Labbuild 2.0

A complete rebuild of the lab provisioning and management system for Red Education, achieving dramatic performance improvements.

## Overview

Labbuild 2.0 is a lab infrastructure automation platform that provisions, configures, and manages cloud-based training environments for Red Hat certification courses.

## Key Achievements

- **90% Performance Improvement**: Reduced lab provisioning time from 45 minutes to under 5 minutes
- **Parallel Processing**: Implemented async/await patterns for concurrent VM provisioning
- **Smart Caching**: MongoDB-based caching layer for template and configuration data
- **RESTful APIs**: FastAPI-powered APIs for integration with LMS platforms

## Technical Stack

- **Core Application**: Python 3.11 with asyncio
- **Web Framework**: Flask for admin dashboard, FastAPI for REST APIs
- **Database**: MongoDB for flexible document storage
- **Task Queue**: Celery with Redis for background job processing
- **Cloud Integration**: Multi-cloud support (AWS, Azure, GCP)

## Architecture Decisions

### Why FastAPI for APIs?
We chose FastAPI for its automatic OpenAPI documentation, type hints support, and excellent async performance. The auto-generated Swagger docs significantly reduced integration time with partner systems.

### MongoDB for Configuration
Training lab configurations are highly variable - each course has different VM requirements, network topologies, and software stacks. MongoDB's flexible schema perfectly suited this use case.
    `.trim(),
    technologies: ["Python", "Flask", "FastAPI", "MongoDB", "Celery", "Redis", "Docker"],
    categorySlug: "backend",
    featured: true,
    featured_order: 2,
    live_url: null,
    github_url: null,
    start_date: "2024-02-01",
    end_date: "2025-08-01",
  },
  {
    title: "Supercomputer Dashboard",
    slug: "supercomputer-dashboard",
    description:
      "Django dashboard for monitoring SahasraT supercomputer at IISc - India's fastest supercomputer with 33,000 cores.",
    content: `
# Supercomputer Dashboard

A comprehensive monitoring and management dashboard for SahasraT, the flagship supercomputer at the Supercomputer Education and Research Centre (SERC), Indian Institute of Science (IISc).

## About SahasraT

SahasraT was India's fastest supercomputer during my tenure, featuring:
- **33,000+ CPU cores** across multiple node types
- **Petascale storage** with Lustre parallel filesystem
- **InfiniBand interconnect** for high-speed node communication
- Serving 500+ researchers across India

## Dashboard Features

### Real-time Monitoring
- Node health status with color-coded visualization
- CPU, memory, and GPU utilization metrics
- Storage capacity and I/O performance
- Network traffic and InfiniBand statistics

### Job Management
- SLURM job queue visualization
- Historical job analytics and reporting
- Resource allocation trends
- User quota management

### Alerting System
- Configurable threshold-based alerts
- Email and SMS notifications
- Integration with Nagios for infrastructure alerts
- Incident tracking and resolution workflow

## Technical Implementation

- **Backend**: Django 3.x with Django REST Framework
- **Frontend**: Bootstrap 4 with Chart.js for visualizations
- **Data Collection**: Custom Python agents using SLURM and IPMI APIs
- **Database**: PostgreSQL with TimescaleDB for time-series metrics
- **Caching**: Redis for real-time metric caching
    `.trim(),
    technologies: ["Django", "Python", "Linux", "HPC", "PostgreSQL", "Redis", "SLURM"],
    categorySlug: "devops",
    featured: true,
    featured_order: 3,
    live_url: null,
    github_url: null,
    start_date: "2019-07-01",
    end_date: "2021-09-01",
  },
  {
    title: "Labbuild Dashboard",
    slug: "labbuild-dashboard",
    description:
      "Flask and MongoDB dashboard for monitoring lab infrastructure, user sessions, and resource utilization across multiple cloud providers.",
    content: `
# Labbuild Dashboard

A centralized monitoring dashboard for the Labbuild platform, providing real-time visibility into lab infrastructure across multiple cloud providers.

## Features

- **Multi-Cloud Overview**: Unified view of resources across AWS, Azure, and GCP
- **Session Monitoring**: Track active user sessions and lab usage
- **Resource Metrics**: CPU, memory, and storage utilization per lab
- **Cost Analytics**: Cloud spending breakdown by course and region
- **User Management**: Admin controls for instructor and student access

## Technical Details

Built with Flask and MongoDB, the dashboard aggregates data from multiple sources and presents it through an intuitive web interface. Real-time updates are powered by Server-Sent Events (SSE) for efficient push notifications.
    `.trim(),
    technologies: ["Flask", "MongoDB", "Python", "Chart.js", "Bootstrap"],
    categorySlug: "backend",
    featured: false,
    featured_order: null,
    live_url: null,
    github_url: null,
    start_date: "2024-03-01",
    end_date: "2024-08-01",
  },
  {
    title: "Operation Schedules",
    slug: "operation-schedules",
    description:
      "FastAPI-based scheduling system for managing complex operational workflows with calendar integration and automated notifications.",
    content: `
# Operation Schedules

A scheduling and workflow management system built with FastAPI for managing complex operational processes.

## Features

- **Calendar Integration**: Sync with Google Calendar and Outlook
- **Automated Scheduling**: Conflict detection and optimal time slot suggestions
- **Workflow Automation**: Multi-step approval processes
- **Notifications**: Email and Slack notifications for schedule changes
- **Reporting**: Generate operational reports and analytics

## Technical Implementation

The system is built on FastAPI for high-performance async operations, with PostgreSQL for persistent storage and Redis for caching frequently accessed schedule data.
    `.trim(),
    technologies: ["FastAPI", "PostgreSQL", "Redis", "Python", "Celery"],
    categorySlug: "backend",
    featured: false,
    featured_order: null,
    live_url: null,
    github_url: null,
    start_date: "2024-05-01",
    end_date: "2024-07-01",
  },
  {
    title: "Pro Fit Club Dashboard",
    slug: "pro-fit-club-dashboard",
    description:
      "Full-stack fitness club management system with member tracking, class scheduling, and payment processing.",
    content: `
# Pro Fit Club Dashboard

A comprehensive fitness club management system designed for gym owners and fitness instructors.

## Features

- **Member Management**: Track memberships, attendance, and fitness progress
- **Class Scheduling**: Interactive calendar for booking group classes
- **Payment Processing**: Subscription management and invoice generation
- **Trainer Portal**: Workout plan creation and client progress tracking
- **Mobile App Integration**: REST APIs for companion mobile application

## Technical Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Payments**: Stripe integration
- **Hosting**: Vercel and Railway
    `.trim(),
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Tailwind CSS"],
    categorySlug: "web-dev",
    featured: false,
    featured_order: null,
    live_url: null,
    github_url: null,
    start_date: "2023-01-01",
    end_date: "2023-06-01",
  },
];
