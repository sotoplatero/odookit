# Project Name

## Odoo Project

This project is set up to work with Odoo using Docker.

### Using the ODV CLI Tool
The `odv` CLI tool is designed to help manage your Odoo development environment. Below are some of the key commands you can use:

- **Create a New Project**: Initialize a new Odoo project.
  ```
  odv new:project -n <project_name>
  ```

- **Create a New Module**: Create a new Odoo module.
  ```
  odv new:module -n <module_name> -t <module_type>
  ```

- **Add a Module**: Add an external Odoo module using a Git repository.
  ```
  odv add:module <repository_url>
  ```

- **Update a Module**: Update an existing Odoo module.
  ```
  odv update:module <module_name>
  ```

- **AI Module Creation**: Create a new Odoo module using AI assistance.
  ```
  odv ai:module -n <module_name> -t <module_type> -d <description>
  ```

- **Backup Project**: Create a backup of the current Odoo project.
  ```
  odv backup -n <project_name> -u <odoo_url>
  ```

### Adding a Module
To add a new module, use the following command with the odv CLI tool:

odv add:module <repository_url>

### Updating a Module
To update an existing module, use the following command with the odv CLI tool:

odv update:module <module_name>

### Deleting a Module
To delete a module, remove its directory from the addons folder and commit the changes:

rm -rf addons/<module_name>
git commit -am "Remove <module_name> module"

### Next Steps
1. cd <project_name>
2. docker compose up
3. Visit http://localhost:<odoo_port>

Happy coding! 🚀 