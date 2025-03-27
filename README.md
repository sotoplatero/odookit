# Odookit

A CLI tool for Odoo development that helps scaffold projects and modules.

## Installation

```bash
npm install -g odookit
```

## Usage

### Create a new Odoo project

```bash
npx odookit new:project
```

This will create a new Odoo project with Docker configuration.

### Create a new frontend module

```bash
npx odookit new:module frontend
```

This will create a new Odoo frontend module with basic structure.

## Project Structure

The generated project will include:
- Docker configuration
- Basic Odoo configuration
- Module scaffolding templates

## Frontend Module Structure

The generated frontend module includes:
- `__manifest__.py` - Module manifest
- `static/src/js/` - JavaScript files
- `static/src/css/` - CSS files
- `static/src/xml/` - QWeb templates
