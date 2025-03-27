#!/usr/bin/env node

import { Command } from 'commander';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Función para verificar si un puerto está disponible
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Función para encontrar el primer puerto disponible
async function findAvailablePort(startPort = 8069) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

const program = new Command();

program
  .name('odookit')
  .description('CLI tool for Odoo development')
  .version('0.0.1');

program
  .command('new:project')
  .description('Create a new Odoo project')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: options.name || 'odoo-project',
        validate: input => {
          if (input.trim().length === 0) {
            return 'Project name cannot be empty';
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Project name can only contain letters, numbers, hyphens and underscores';
          }
          return true;
        }
      }
    ]);

    // Verificar si el proyecto existe
    const projectPath = path.join(process.cwd(), answers.name);
    if (fs.existsSync(projectPath)) {
      const overwrite = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Project ${answers.name} already exists. Do you want to overwrite it?`,
          default: false
        }
      ]);

      if (!overwrite.confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    // Encontrar el primer puerto disponible
    const availablePort = await findAvailablePort();

    // Continuar con el resto de las preguntas
    const moreAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'odooImage',
        message: 'Odoo Docker image:',
        default: 'odoo:18.0',
        validate: input => {
          if (input.trim().length === 0) {
            return 'Docker image cannot be empty';
          }
          if (!/^[a-zA-Z0-9-_:./]+$/.test(input)) {
            return 'Invalid Docker image name';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'odooPort',
        message: 'Which port should Odoo run on?',
        default: availablePort.toString(),
        validate: async input => {
          const port = parseInt(input);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Please enter a valid port number (1-65535)';
          }
          if (!(await isPortAvailable(port))) {
            return 'This port is already in use';
          }
          return true;
        }
      }
    ]);

    // Combinar todas las respuestas
    const finalAnswers = {
      ...answers,
      ...moreAnswers,
      useDocker: true
    };

    const { default: nodePlop } = await import('node-plop');
    const plop = await nodePlop(resolve(__dirname, '../templates/plopfile.js'), {
      require: ['@babel/register'],
      destBasePath: process.cwd()
    });
    const generator = await plop.getGenerator('project');
    await generator.runActions(finalAnswers);

    console.log(`
🚀 Project created successfully!

Your Odoo project is ready to use. Here's what you need to do next:

1. Navigate to your project:
   cd ${answers.name}

2. Start the containers:
   docker compose up

3. Access Odoo:
   http://localhost:${moreAnswers.odooPort}

4. Create new modules:
   npx odookit new:module

The project structure:
- addons/     → Place your Odoo modules here
- config/     → Odoo configuration files
- docker-compose.yml → Docker configuration

Happy coding! 🎉
`);
  });

program
  .command('new:module')
  .description('Create a new Odoo module')
  .option('-n, --name <name>', 'Module name')
  .option('-t, --type <type>', 'Module type')
  .action(async (options) => {
    const typeAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Module type:',
        default: options.type || 'frontend',
        choices: [
          { name: 'Frontend Module (JS/CSS/XML)', value: 'frontend' },
          { name: 'Backend Module (Python/XML)', value: 'backend' }
        ]
      }
    ]);

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Module name:',
        default: options.name || 'custom_module',
        validate: input => {
          if (input.trim().length === 0) {
            return 'Module name cannot be empty';
          }
          if (!/^[a-zA-Z0-9_]+$/.test(input)) {
            return 'Module name can only contain letters, numbers and underscores';
          }
          return true;
        }
      }
    ]);

    // Verificar si el módulo existe
    const modulePath = path.join(process.cwd(), answers.name);
    if (fs.existsSync(modulePath)) {
      const overwrite = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Module ${answers.name} already exists. Do you want to overwrite it?`,
          default: false
        }
      ]);

      if (!overwrite.confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    // Continuar con el resto de las preguntas
    const moreAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'summary',
        message: 'Module summary:',
        default: 'Custom Odoo module'
      },
      {
        type: 'input',
        name: 'version',
        message: 'Module version:',
        default: '16.0.1.0.0',
        validate: input => {
          if (!/^\d+\.\d+\.\d+\.\d+\.\d+$/.test(input)) {
            return 'Version must be in format X.Y.Z.W.V (e.g., 16.0.1.0.0)';
          }
          return true;
        }
      }
    ]);

    // Combinar todas las respuestas
    const finalAnswers = {
      ...typeAnswer,
      ...answers,
      ...moreAnswers
    };

    const { default: nodePlop } = await import('node-plop');
    const plop = await nodePlop(resolve(__dirname, '../templates/plopfile.js'), {
      require: ['@babel/register'],
      destBasePath: process.cwd()
    });
    const generator = await plop.getGenerator(`module-${finalAnswers.type}`);
    await generator.runActions(finalAnswers);

    console.log(`
🎉 Module created successfully!

Your ${typeAnswer.type} module "${answers.name}" is ready:

${typeAnswer.type === 'frontend' ? `
Frontend Module Structure:
- static/src/js/    → JavaScript files
- static/src/css/   → CSS files
- static/src/xml/   → QWeb templates
- views/assets.xml  → Asset bundle definition` : `
Backend Module Structure:
- models/          → Python model definitions
- views/          → Form, tree and search views
- security/       → Access rights and rules`}

To use this module:
1. Make sure it's in your addons path
2. Update the module list in Odoo
3. Install the module from the Apps menu

Next steps:
1. Edit __manifest__.py to add dependencies
2. Start building your module!

Happy coding! 🚀
`);
  });

program
  .command('add:module')
  .description('Add an external Odoo module using git subtree')
  .argument('[repository]', 'Git repository URL')
  .option('-b, --branch <branch>', 'Branch to use', '')
  .option('-p, --prefix <prefix>', 'Path within the repository', '')
  .option('-n, --name <name>', 'Module name (defaults to repository name)')
  .action(async (repository, options) => {
    try {
      // Verificar que estamos en un proyecto Odoo (existe docker-compose.yml)
      if (!fs.existsSync('docker-compose.yml')) {
        console.error('❌ Error: Must be run from an Odoo project directory (docker-compose.yml not found)');
        return;
      }

      // Verificar/crear el directorio addons
      if (!fs.existsSync('addons')) {
        console.log('📁 Creating addons directory...');
        fs.mkdirSync('addons');
        // Crear un .gitkeep para mantener el directorio en git
        fs.writeFileSync('addons/.gitkeep', '');
      }

      // Si no se proporcionó el repositorio, preguntar por él
      if (!repository) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'repository',
            message: 'Git repository URL:',
            validate: input => {
              if (input.trim().length === 0) {
                return 'Repository URL cannot be empty';
              }
              // Validación básica de URL de git
              if (!/^(https?:\/\/|git@).*\.git$/.test(input)) {
                return 'Please enter a valid git repository URL (ending in .git)';
              }
              return true;
            }
          }
        ]);
        repository = answer.repository;
      }

      // Si no se proporcionó la rama, preguntar por ella
      if (!options.branch) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'branch',
            message: 'Git branch:',
            default: 'main',
            validate: input => {
              if (input.trim().length === 0) {
                return 'Branch name cannot be empty';
              }
              return true;
            }
          }
        ]);
        options.branch = answer.branch;
      }

      // Extraer el nombre del módulo del repositorio si no se especificó
      let moduleName = options.name;
      if (!moduleName) {
        moduleName = repository.split('/').pop().replace('.git', '');
      }

      // Construir el path completo para el subtree
      const prefix = options.prefix ? 
        path.join('addons', moduleName, options.prefix).replace(/\\/g, '/') : 
        path.join('addons', moduleName).replace(/\\/g, '/');

      // Confirmar la operación
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Will add module from:
  Repository: ${repository}
  Branch: ${options.branch}
  Target: ${prefix}
Proceed?`,
          default: true
        }
      ]);

      if (!confirm.proceed) {
        console.log('Operation cancelled');
        return;
      }

      // Verificar si el directorio destino ya existe
      if (fs.existsSync(prefix)) {
        const overwrite = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Directory ${prefix} already exists. Do you want to overwrite it?`,
            default: false
          }
        ]);

        if (!overwrite.confirm) {
          console.log('Operation cancelled');
          return;
        }

        // Eliminar el directorio existente
        fs.rmSync(prefix, { recursive: true, force: true });
      }

      console.log('🔄 Adding module...');

      // Inicializar git si no existe
      if (!fs.existsSync('.git')) {
        await execAsync('git init');
      }

      // Agregar el subtree
      const { stdout, stderr } = await execAsync(
        `git subtree add --prefix=${prefix} ${repository} ${options.branch} --squash`
      );

      console.log(`
✅ Module added successfully!

Module information:
- Name: ${moduleName}
- Source: ${repository}
- Branch: ${options.branch}
- Location: ${prefix}

To update this module in the future, use:
git subtree pull --prefix=${prefix} ${repository} ${options.branch} --squash

To install the module:
1. Restart your Odoo server
2. Update module list in Odoo
3. Install the module from Apps menu

Happy coding! 🚀
`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.stderr) {
        console.error('Details:', error.stderr);
      }
    }
  });

program
  .command('update:module')
  .description('Update an existing Odoo module using git subtree')
  .argument('[module]', 'Module name to update')
  .option('-b, --branch <branch>', 'Branch to use', '')
  .option('-r, --repository <repository>', 'Git repository URL (if different from original)')
  .action(async (module, options) => {
    try {
      // Verificar que estamos en un proyecto Odoo
      if (!fs.existsSync('docker-compose.yml')) {
        console.error('❌ Error: Must be run from an Odoo project directory (docker-compose.yml not found)');
        return;
      }

      // Verificar que existe el directorio addons
      if (!fs.existsSync('addons')) {
        console.error('❌ Error: addons directory not found');
        return;
      }

      // Obtener lista de módulos existentes
      const modules = fs.readdirSync('addons', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .filter(dirent => !dirent.name.startsWith('.')) // Excluir directorios ocultos
        .map(dirent => dirent.name);

      if (modules.length === 0) {
        console.error('❌ Error: No modules found in addons directory');
        return;
      }

      // Si no se especificó el módulo, mostrar lista para seleccionar
      if (!module) {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'module',
            message: 'Select module to update:',
            choices: modules.map(name => ({
              name: name,
              value: name
            }))
          }
        ]);
        module = answer.module;
      } else if (!modules.includes(module)) {
        console.error(`❌ Error: Module '${module}' not found in addons directory`);
        console.log('\nAvailable modules:');
        modules.forEach(name => console.log(`- ${name}`));
        return;
      }

      const moduleDir = path.join('addons', module);

      // Obtener el repositorio del último commit de subtree si no se especificó
      let repository = options.repository;
      if (!repository) {
        try {
          const { stdout } = await execAsync(
            `git log -1 --grep="git-subtree-repo:" --pretty=format:"%b" $(git log -1 --grep="git-subtree-dir: ${moduleDir}" --pretty=format:"%H")`
          );
          const repoMatch = stdout.match(/git-subtree-repo: (.+)$/m);
          if (repoMatch) {
            repository = repoMatch[1];
          }
        } catch (error) {
          // Continuar y preguntar por el repositorio
        }

        // Si no se encontró el repositorio, preguntar por él
        if (!repository) {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'repository',
              message: 'Git repository URL:',
              validate: input => {
                if (input.trim().length === 0) {
                  return 'Repository URL cannot be empty';
                }
                // Validación básica de URL de git
                if (!/^(https?:\/\/|git@).*\.git$/.test(input)) {
                  return 'Please enter a valid git repository URL (ending in .git)';
                }
                return true;
              }
            }
          ]);
          repository = answer.repository;
        }
      }

      // Obtener la rama del último commit de subtree si no se especificó
      let branch = options.branch;
      if (!branch) {
        try {
          const { stdout } = await execAsync(
            `git log -1 --grep="git-subtree-branch:" --pretty=format:"%b" $(git log -1 --grep="git-subtree-dir: ${moduleDir}" --pretty=format:"%H")`
          );
          const branchMatch = stdout.match(/git-subtree-branch: (.+)$/m);
          if (branchMatch) {
            branch = branchMatch[1];
          }
        } catch (error) {
          // Continuar y preguntar por la rama
        }

        // Si no se encontró la rama, preguntar por ella
        if (!branch) {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'branch',
              message: 'Git branch:',
              default: 'main',
              validate: input => {
                if (input.trim().length === 0) {
                  return 'Branch name cannot be empty';
                }
                return true;
              }
            }
          ]);
          branch = answer.branch;
        }
      }

      // Confirmar la operación
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Will update module from:
  Module: ${module}
  Repository: ${repository}
  Branch: ${branch}
Proceed?`,
          default: true
        }
      ]);

      if (!confirm.proceed) {
        console.log('Operation cancelled');
        return;
      }

      console.log('🔄 Updating module...');

      // Actualizar el subtree
      const { stdout, stderr } = await execAsync(
        `git subtree pull --prefix=${moduleDir} ${repository} ${branch} --squash`
      );

      console.log(`
✅ Module updated successfully!

Module information:
- Name: ${module}
- Source: ${repository}
- Branch: ${branch}
- Location: ${moduleDir}

To install updates:
1. Restart your Odoo server
2. Update the module in Odoo

Happy coding! 🚀
`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.stderr) {
        console.error('Details:', error.stderr);
      }
    }
  });

program.parse();
