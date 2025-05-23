import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { isPortAvailable, findAvailablePort } from '../utils/port.js';
import nodePlop from 'node-plop';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

export async function newProjectCommand(options) {
  try {
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

    const projectDir = path.resolve(process.cwd(), answers.name);

    // Verify if the directory already exists
    if (fs.existsSync(projectDir)) {
      console.error(`❌ Error: Directory ${answers.name} already exists`);
      return;
    }

    // Find the first available port
    const availablePort = await findAvailablePort();

    // Ask for the image and port
    const moreAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'odooType',
        message: 'Odoo version:',
        choices: [
          { name: 'Community Edition', value: 'community' },
          { name: 'Enterprise Edition', value: 'enterprise' }
        ]
      },
      {
        type: 'list',
        name: 'odooVersion',
        message: 'Odoo version:',
        choices: [
          { name: '18.0 (Latest)', value: '18.0' },
          { name: '17.0', value: '17.0' },
          { name: '16.0', value: '16.0' },
          { name: '15.0', value: '15.0' }
        ]
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
      },
      {
        type: 'input',
        name: 'dbPort',
        message: 'Which port should PostgreSQL run on?',
        default: (answers) => {
          const odooPort = parseInt(answers.odooPort);
          return (odooPort - 2608).toString(); // Por ejemplo: 8069 -> 5461
        },
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
      },
      {
        type: 'confirm',
        name: 'runAfterCreate',
        message: 'Do you want to run the project after creation?',
        default: false
      }
    ]);

    // Determine the Docker image
    const odooImage = moreAnswers.odooType === 'enterprise' 
      ? `odoo/odoo-enterprise:${moreAnswers.odooVersion}`
      : `odoo:${moreAnswers.odooVersion}`;

    // Combine all answers
    const finalAnswers = {
      ...answers,
      ...moreAnswers,
      odooImage,
      useDocker: true,
      projectDir
    };

    // Use plop to generate the project
    const plop = await nodePlop(path.resolve(__dirname, '../../templates/plopfile.js'));
    const generator = plop.getGenerator('project');
    await generator.runActions(finalAnswers);


    // Initialize git
    console.log('🔧 Initializing git repository...');
    const execOptions = {
      cwd: projectDir,
      shell: 'powershell.exe'
    };

    await execAsync('git init', execOptions);
    await execAsync('git add .', execOptions);
    await execAsync('git commit -m "Initial commit"', execOptions);

    console.log(`
✨ Project created successfully!

Project structure:
${projectDir}
├── addons/     # Custom modules
├── backups/    # Database backups
├── config/     # Configuration files
├── data/       # Additional data files
└── docker-compose.yml

Configuration:
- Odoo Image: ${odooImage}
- Odoo Port: ${moreAnswers.odooPort}
- Database Port: ${moreAnswers.dbPort}

Next steps:
1. cd ${answers.name}
2. docker compose up
3. Visit http://localhost:${moreAnswers.odooPort}

Happy coding! 🚀
`);

    // Run the project if requested
    if (moreAnswers.runAfterCreate) {
      console.log('🚀 Starting the project...');
      try {
        await execAsync('docker compose up -d', execOptions);
        console.log(`
✅ Project is running!
- Web Interface: http://localhost:${moreAnswers.odooPort}
- Database Manager: http://localhost:${moreAnswers.odooPort}/web/database/manager

To stop the project, run:
cd ${answers.name} && docker compose down
`);
      } catch (error) {
        console.error('❌ Error starting the project:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
