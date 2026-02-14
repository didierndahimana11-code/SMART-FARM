# SmartFarm Credit - Professional Digital Agriculture Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Silicon Valley Standard](https://img.shields.io/badge/Standards-Silicon%20Valley-blueviolet.svg)](#)

SmartFarm Credit is a state-of-the-art digital agriculture platform designed to empower farmers with accessible micro-loans, real-time market insights, and a direct marketplace connection to buyers. This project is built with professional-grade architecture, advanced security, and industry-standard Font Awesome iconography.

## System Features

- **Micro-Loan Engine**: Automated loan applications for seasonal crops, equipment, and land.
- **Direct Marketplace**: Seamless farmer-to-buyer transactions bypassing middle-men.
- **Market Price Intelligence**: Real-time tracking of crop prices across various regions.
- **Glassmorphic UI**: Premium, modern interface with high-end aesthetics and responsiveness.
- **Professional API**: Fully documented with Swagger/OpenAPI, secured with JWT and Helmet.
- **Structured Logging**: Advanced system tracking using `winston` for error and activity logs.

---

## Project Structure

The repository is organized into two primary micro-services for better scalability and maintainability:

```text
smartfarm-credit/
├── Back/               # Backend API Service (Node.js/Express)
│   ├── database/       # SQLite storage & logic
│   ├── routes/         # RESTful API endpoints
│   ├── logger.js       # Winston logging configuration
│   ├── swagger.js      # API documentation setup
│   └── server.js      # Service entry point
├── Front/              # Frontend Web Application (Vanilla JS/Glassmorphic CSS)
│   ├── index.html      # Landing Page
│   ├── js/             # Centralized JavaScript services
│   └── css/            # Premium style definitions
├── package.json        # Root Orchestrator
└── README.md           # Master Documentation
```

---

## Technical Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Glassmorphism), BrowserSync (Dev)
- **Backend**: Node.js, Express.js, Helmet.js (Security), Winston (Logging)
- **Database**: SQLite3 (Persistent storage)
- **Documentation**: Swagger UI / OpenAPI 3.0
- **Orchestration**: Concurrently (Parallel service execution)

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Git](https://git-scm.com/)

### Setup Instructions

1. **Clone & Navigate**
   ```bash
   git clone https://github.com/didierndahimana11-code/SMART-FARM.git
   cd SMART-FARM
   ```

2. **Install All Dependencies**
   ```bash
   # This installs dependencies for both Root, Front, and Back
   npm run install-all
   ```

3. **Configure Environment**
   Navigate to `Back/.env` and ensure your `JWT_SECRET` and `PORT` are set. (Default port is 3000).

4. **Launch Development Environment**
   ```bash
   # This runs both the Backend and Frontend with Live Reload
   npm run dev
   ```

- **Frontend Access**: [http://localhost:3001](http://localhost:3001) (Live Reload via Port 3001)
- **Backend API**: [http://localhost:3000/api](http://localhost:3000/api)
- **API Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## Security & Standards

This system implements several high-level professional standards:
- **Helmet.js**: Protection against well-known web vulnerabilities.
- **JWT (JSON Web Tokens)**: Secure stateless authentication.
- **Bcrypt**: Industrial-strength password hashing.
- **Global Error Handling**: Standardized JSON error responses.
- **Relative Pathing**: Centralized API definitions for easy deployment.

---

## Documentation

The API is fully documented using Swagger. Once the server is running, visit `/api-docs` to see the full list of endpoints, request formats, and response schemas.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ for the SmartFarm Team**
*Last Professional Update: February 2026*
