import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import ora from 'ora';

const execAsync = promisify(exec);

async function getDatabases(url) {
  try {
    const response = await fetch(`${url}/web/database/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.result) {
      throw new Error('Invalid response from Odoo server');
    }

    return data.result;
  } catch (error) {
    throw new Error(`Error connecting to Odoo server: ${error.message}`);
  }
}

export async function backupProjectCommand(options) {
  const spinner = ora();
  try {
    // Solicitar URL si no se proporciona
    let url = options.url;
    if (!url) {
      const urlAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter Odoo server URL (e.g., http://localhost:8069):',
          validate: input => input.startsWith('http') || 'Please enter a valid URL starting with http'
        }
      ]);
      url = urlAnswer.url;
    }

    // Obtener lista de bases de datos
    spinner.start('Connecting to Odoo server...');
    const databases = await getDatabases(url);
    spinner.succeed('Connected to Odoo server');
    
    if (!databases || databases.length === 0) {
      throw new Error('No databases found on the Odoo server');
    }

    // Seleccionar base de datos
    const dbAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'Select database to backup:',
        choices: databases
      }
    ]);

    // Solicitar contraseña maestra
    const passwordAnswer = await inquirer.prompt([
      {
        type: 'password',
        name: 'masterPassword',
        message: 'Enter master password:',
        mask: '*'
      }
    ]);

    // Solicitar directorio de destino
    const backupDirAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'backupDir',
        message: 'Enter backup directory (default: current directory):',
        default: process.cwd()
      }
    ]);

    const projectName = options.name || dbAnswer.database;
    const backupDir = resolve(backupDirAnswer.backupDir);
    
    // Create backup directory if it doesn't exist
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${projectName}_${timestamp}`;
    const backupPath = resolve(backupDir, backupName);

    console.log(chalk.blue(`Backup will be saved to: ${backupPath}.zip`));

    // Create backup using Odoo's backup utility
    const backupCommand = `curl -X POST "${url}/web/database/backup" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "master_pwd=${passwordAnswer.masterPassword}&name=${dbAnswer.database}&backup_format=zip" \
      --output ${backupPath}.zip`;

    spinner.start('Creating backup...');
    await execAsync(backupCommand);
    spinner.succeed('Backup created successfully');
    
    console.log(chalk.green(`Backup saved at: ${backupPath}.zip`));
    
  } catch (error) {
    spinner.fail('Backup failed');
    console.error(chalk.red('Error creating backup:'), error.message);
    process.exit(1);
  }
} 