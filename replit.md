# Florist E-commerce Application

## Overview

This is a full-stack florist e-commerce web application built with Node.js and Express. The application allows users to browse flowers, place orders, and manage deliveries. It includes user authentication, product management, order processing, and payment tracking functionality. The application uses a traditional server-side rendering approach with EJS templates and implements session-based authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Web Framework & Templating
- **Express.js 5.x** - Modern Node.js web framework for handling HTTP requests and routing
- **EJS (Embedded JavaScript)** - Server-side templating engine for rendering dynamic HTML pages
- **Rationale**: Express provides a robust, minimalist framework for web applications while EJS allows for straightforward server-side rendering with familiar JavaScript syntax

### Database Layer
- **better-sqlite3** - Synchronous SQLite3 database interface
- **Database Schema**:
  - `users` - User accounts with role-based access (user/admin)
  - `flowers` - Product catalog with pricing and inventory
  - `products` - Product variants tied to flowers
  - `orders` - Order management with delivery tracking and status
  - `payments` - Payment transaction records
- **Rationale**: SQLite provides a lightweight, file-based database solution ideal for small to medium applications without requiring a separate database server. The synchronous API simplifies code flow and error handling.

### Authentication & Security
- **bcrypt** - Password hashing library for secure credential storage
- **express-session** - Session middleware for user authentication state management
- **Approach**: Traditional session-based authentication with server-side session storage
- **Rationale**: Session-based auth provides a straightforward security model suitable for server-rendered applications. Bcrypt ensures passwords are securely hashed with industry-standard algorithms.

### Request Processing
- **body-parser** - Middleware for parsing incoming request bodies
- **Supports**: JSON and URL-encoded form data
- **Rationale**: Essential for processing form submissions and API requests in Express applications

### Frontend Architecture
- **Static CSS** - Custom styling without preprocessors or frameworks
- **Design Approach**: Minimalist black and white theme with sticky header navigation
- **Layout Strategy**: Flexbox-based responsive design with container-constrained content
- **Rationale**: Simple, maintainable CSS suitable for a focused e-commerce experience without framework overhead

### Application Structure
- **Monolithic Architecture** - Single-server application combining frontend and backend
- **MVC Pattern** - Implied separation with routes (controllers), database (models), and EJS views
- **Session Management** - Server-side sessions for maintaining user state across requests
- **Rationale**: Simplified deployment and development for small to medium-scale applications

## External Dependencies

### Runtime Dependencies
- **Node.js Packages**:
  - `express` (^5.1.0) - Web application framework
  - `express-session` (^1.18.2) - Session management
  - `bcrypt` (^6.0.0) - Password hashing
  - `better-sqlite3` (^12.4.5) - SQLite database driver
  - `ejs` (^3.1.10) - Template engine
  - `body-parser` (^2.2.0) - Request body parsing

### Database
- **SQLite** - Embedded file-based relational database (`florist.db`)
- **No external database server required**

### Third-Party Services
- Currently no external API integrations identified
- Payment gateway integration likely needed for production (currently has payments table structure)
- Email service may be required for order confirmations and user notifications

### Development & Deployment Considerations
- No build process or transpilation required
- Direct Node.js execution
- Static assets served from `public/` directory
- Database file (`florist.db`) created automatically on first run