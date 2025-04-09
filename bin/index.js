#!/usr/bin/env node --no-deprecation

import { Command } from 'commander';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { isPortAvailable, findAvailablePort } from '../src/utils/port.js';
import { newProjectCommand } from '../src/commands/new-project.js';
import { newModuleCommand } from '../src/commands/new-module.js';
import { addModuleCommand } from '../src/commands/add-module.js';
import { updateModuleCommand } from '../src/commands/update-module.js';
import { aiModuleCommand } from '../src/commands/ai-module.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('odookit')
  .description('CLI tool for Odoo development')
  .version('0.0.1');

program
  .command('new:project')
  .description('Create a new Odoo project')
  .option('-n, --name <name>', 'Project name')
  .action(newProjectCommand);

program
  .command('new:module')
  .description('Create a new Odoo module')
  .option('-n, --name <name>', 'Module name')
  .option('-t, --type <type>', 'Module type')
  .action(newModuleCommand);

program
  .command('add:module')
  .description('Add an external Odoo module using git subtree')
  .argument('[repository]', 'Git repository URL')
  .option('-b, --branch <branch>', 'Branch to use', '')
  .option('-r, --repository <repository>', 'Git repository URL (if different from original)')
  .action(addModuleCommand);

program
  .command('update:module')
  .description('Update an existing Odoo module using git subtree')
  .argument('[module]', 'Module name to update')
  .option('-b, --branch <branch>', 'Branch to use', '')
  .option('-r, --repository <repository>', 'Git repository URL (if different from original)')
  .action(updateModuleCommand);

program
  .command('ai:module')
  .description('Create a new Odoo module using AI assistance')
  .option('-n, --name <name>', 'Module name')
  .option('-t, --type <type>', 'Module type (backend/frontend)', 'backend')
  .option('-d, --description <description>', 'Module description/requirements')
  .action(aiModuleCommand);

program.parse();
