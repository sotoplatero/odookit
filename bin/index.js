#!/usr/bin/env node

import { Command } from 'commander';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('odookit')
  .description('CLI tool for Odoo development')
  .version('1.0.0');

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
        default: '8069',
        validate: input => {
          const port = parseInt(input);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Please enter a valid port number (1-65535)';
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
      destBasePath: process.cwd() // Usar el directorio actual
    });
    const generator = await plop.getGenerator('project');
    await generator.runActions(finalAnswers);
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
      destBasePath: process.cwd() // Usar el directorio actual
    });
    const generator = await plop.getGenerator(`module-${finalAnswers.type}`);
    await generator.runActions(finalAnswers);
  });

program.parse();
