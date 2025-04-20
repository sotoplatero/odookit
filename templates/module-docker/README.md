# Module Docker Setup

This directory contains the Docker configuration for running this Odoo module independently.

## Quick Start

1. Start the containers:
   ```bash
   docker compose up -d
   ```

2. Access Odoo:
   - Web Interface: http://localhost:8069
   - Database Manager: http://localhost:8069/web/database/manager
   - Default credentials:
     - Username: admin
     - Password: admin

3. Stop the containers:
   ```bash
   docker compose down
   ```

## Configuration

- The module is mounted at `/mnt/extra-addons`
- Odoo configuration is in `config/odoo.conf`
- Database data is persisted in Docker volumes
- The module will be available in the Odoo apps list

## Development

- The module directory is mounted directly, so changes are reflected immediately
- Database is persisted between restarts
- Use `docker compose logs -f` to view logs 