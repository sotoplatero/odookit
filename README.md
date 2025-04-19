# Odookit

Odookit is a powerful Command Line Interface (CLI) tool designed to streamline Odoo development workflows. It provides an efficient way to scaffold new Odoo projects and modules, following best practices and modern development standards.

## Features

- Project scaffolding with Docker integration
- Module generation for both backend and frontend
- Standardized project structure
- Development environment setup automation

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Docker (for containerized development)

## Installation

Install Odookit globally using npm:

```bash
npm install -g odookit
```

## Quick Start

### Creating a New Odoo Project

Initialize a new Odoo project with Docker configuration:

```bash
npx odookit new:project
```

This command sets up:
- Docker Compose configuration
- Odoo configuration files
- Development environment structure
- Basic project scaffolding

### Running the Project

After generating the project, navigate to the project directory and start the services:

```bash
cd your-project-name
docker-compose up -d
```

The Odoo instance will be available at:
- Web Interface: http://localhost:8069
- Database Manager: http://localhost:8069/web/database/manager

To stop the services:
```bash
docker-compose down
```

### Creating a New Module

Generate a new frontend module:

```bash
npx odookit new:module frontend
```

## Project Structure

```
project/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── odoo/
│   └── config/
│       └── odoo.conf
└── modules/
    └── [your-modules]
```

## Module Structure

Generated modules follow Odoo's standard structure:

```
module/
├── __manifest__.py
├── static/
│   ├── src/
│   │   ├── js/
│   │   ├── css/
│   │   └── xml/
│   └── description/
└── views/
```

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in our GitHub repository or contact our development team.
