# 🏥 MedicalInk Backend

> A comprehensive medical management system backend built with NestJS,
> TypeScript, and PostgreSQL

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (Super Admin, Admin, Doctor)
- Email confirmation system
- Password reset functionality

### 👥 User Management

- **Staff Accounts**: Doctors and administrators with detailed profiles
- **Patient Management**: Complete patient information and medical history
- **Doctor Profiles**: Specialties, experience, qualifications, and achievements

### 📅 Appointment System

- **Schedule Management**: Doctor availability and time slots
- **Appointment Booking**: Patient appointment scheduling
- **Status Tracking**: Real-time appointment status updates
- **Work Locations**: Multiple clinic/hospital locations

### 🏥 Medical Features

- **Specialty Management**: Medical specialties and departments
- **Q&A System**: Patient questions with doctor answers
- **Review System**: Patient feedback and ratings
- **Blog System**: Medical articles and health information

### 📊 Advanced Features

- **Internationalization**: Multi-language support (English/Vietnamese)
- **API Documentation**: Auto-generated Swagger documentation
- **Request Logging**: Morgan middleware for HTTP request logging
- **Data Validation**: Comprehensive input validation with class-validator
- **Type Safety**: Full TypeScript implementation

## 🛠 Tech Stack

### Backend Framework

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **Express** - Web application framework

### Database & ORM

- **PostgreSQL** - Relational database
- **Prisma** - Next-generation ORM
- **Supabase** - Database hosting

### Authentication & Security

- **JWT** - JSON Web Tokens
- **bcrypt** - Password hashing
- **class-validator** - Input validation

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Supertest** - HTTP testing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) (recommend v24.4.1)
- **pnpm** (recommend v10.13.1)
- **PostgreSQL** (v13 or higher)
- **Git**

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd medicalink-be
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Copy environment variables**
   ```bash
   cp .env.example .env
   # or
   cp .env.example .env.local
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
APP_PORT=3000
APP_NAME=medicalink-be
API_PREFIX=api
FRONTEND_DOMAIN=http://localhost:3001
BACKEND_DOMAIN=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/medicalink_db"
DIRECT_URL="postgresql://username:password@localhost:5432/medicalink_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION_TIME=1d

# Internationalization
APP_FALLBACK_LANGUAGE=en
APP_HEADER_LANGUAGE=x-custom-lang
```

### Environment Variables Explained

| Variable              | Description                  | Default       |
| --------------------- | ---------------------------- | ------------- |
| `NODE_ENV`            | Application environment      | `development` |
| `APP_PORT`            | Server port                  | `3000`        |
| `API_PREFIX`          | API route prefix             | `api`         |
| `DATABASE_URL`        | PostgreSQL connection string | Required      |
| `JWT_SECRET`          | JWT signing secret           | Required      |
| `JWT_EXPIRATION_TIME` | JWT token expiration         | `1d`          |

## 🗄️ Database Setup

1. **Create PostgreSQL database**

   ```sql
   CREATE DATABASE medicalink_db;
   ```

2. **Generate Prisma client**

   ```bash
   pnpm prisma generate
   ```

3. **Run database migrations**

   ```bash
   pnpm prisma migrate dev
   ```

4. **Seed the database (optional)**
   ```bash
   pnpm prisma db seed
   ```

### Database Schema Overview

The application includes the following main entities:

- **StaffAccount** - Staff members (doctors, admins)
- **Patient** - Patient information
- **Doctor** - Doctor profiles and specialties
- **Specialty** - Medical specialties
- **Appointment** - Patient appointments
- **Schedule** - Doctor availability
- **Review** - Patient reviews
- **Question/Answer** - Q&A system
- **Blog** - Medical articles

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start with hot reload
pnpm start:dev

# Start with debug mode
pnpm start:debug
```

### Production Mode

```bash
# Build the application
pnpm build

# Start production server
pnpm start:prod
```

The application will be available at:

- **API**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/docs

## 📚 API Documentation

### Swagger UI

Access the interactive API documentation at `/docs` endpoint:

```
http://localhost:3000/docs
```

### API Endpoints

#### Authentication

Currently on working...

#### API Versioning

The API supports versioning through URI:

- `/api/v1/...` - Version 1 endpoints

### Request/Response Format

All API responses follow a consistent format:

```json
{
  "data": {},
  "message": "Success message",
  "statusCode": 200
}
```

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── config/             # Auth configuration
│   ├── dto/                # Data transfer objects
│   ├── entities/           # Auth entities
│   ├── auth.controller.ts  # Auth endpoints
│   ├── auth.service.ts     # Auth business logic
│   └── auth.module.ts      # Auth module
├── config/                 # Application configuration
│   ├── app.config.ts       # App configuration
│   └── config.type.ts      # Configuration types
├── i18n/                   # Internationalization
│   ├── en/                 # English translations
│   └── vi/                 # Vietnamese translations
├── utils/                  # Utility functions
│   ├── transformers/       # Data transformers
│   ├── types/              # TypeScript types
│   ├── morgan.middleware.ts # Request logging
│   └── serializer.interceptor.ts # Response serialization
├── app.module.ts           # Root module
└── main.ts                 # Application entry point

prisma/
├── migrations/             # Database migrations
├── schema.prisma          # Database schema
├── prisma.module.ts       # Prisma module
└── prisma.service.ts      # Prisma service

test/                       # Test files
├── app.e2e-spec.ts        # End-to-end tests
└── jest-e2e.json          # Jest configuration
```

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### End-to-End Tests

```bash
# Run e2e tests
pnpm test:e2e
```

### Test Structure

- **Unit Tests**: Test individual services and controllers
- **Integration Tests**: Test module interactions
- **E2E Tests**: Test complete user workflows

## 📜 Scripts

| Script             | Description                               |
| ------------------ | ----------------------------------------- |
| `pnpm start`       | Start the application                     |
| `pnpm start:dev`   | Start in development mode with hot reload |
| `pnpm start:debug` | Start in debug mode                       |
| `pnpm start:prod`  | Start in production mode                  |
| `pnpm build`       | Build the application                     |
| `pnpm test`        | Run unit tests                            |
| `pnpm test:e2e`    | Run end-to-end tests                      |
| `pnpm test:cov`    | Run tests with coverage                   |
| `pnpm lint`        | Run ESLint                                |
| `pnpm format`      | Format code with Prettier                 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: implement amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the UNLICENSED License - see the
[LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation at `/docs`

---

<div align="center">
  <p>Built with ❤️ by the MedicalInk Team</p>
  <p>© 2025 MedicalInk. All rights reserved.</p>
</div>
