import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import nodePlop from 'node-plop';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mapping of Odoo versions to recommended PostgreSQL versions
const POSTGRES_VERSIONS = {
  '18.0': '16',
  '17.0': '15',
  '16.0': '14',
  '15.0': '13'
};

export async function addDockerCommand() {
  try {
    // Verify that we are in an Odoo module directory
    if (!fs.existsSync('__manifest__.py')) {
      console.error('❌ Error: Must be run from an Odoo module directory (__manifest__.py not found)');
      return;
    }

    // Get the module name (current folder name)
    const moduleName = path.basename(process.cwd());

    // Read the Odoo version from the manifest
    const manifestContent = fs.readFileSync('__manifest__.py', 'utf8');
    const versionMatch = manifestContent.match(/['"]version['"]\s*:\s*['"]([^'"]+)['"]/);
    let odooVersion = versionMatch ? versionMatch[1] : null;

    // Verify the version format (X.Y.Z.W.V)
    const versionRegex = /^\d+\.\d+\.\d+\.\d+\.\d+$/;
    if (!odooVersion || !versionRegex.test(odooVersion)) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'odooVersion',
          message: 'Select Odoo version:',
          choices: [
            { name: '18.0 (Latest)', value: '18.0' },
            { name: '17.0', value: '17.0' },
            { name: '16.0', value: '16.0' },
            { name: '15.0', value: '15.0' }
          ],
          default: '16.0'
        }
      ]);
      odooVersion = answers.odooVersion;
    } else {
      // Extract the major version (X.Y) from the full version
      odooVersion = odooVersion.split('.').slice(0, 2).join('.');
    }

    // Get the recommended PostgreSQL version
    const postgresVersion = POSTGRES_VERSIONS[odooVersion] || '13';

    // Verify/create the docker directory
    const dockerDir = path.join(process.cwd(), 'docker');
    if (fs.existsSync(dockerDir)) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'recreate',
          message: 'Docker directory already exists. Do you want to recreate it?',
          default: false
        }
      ]);

      if (!answers.recreate) {
        console.log('Operation cancelled.');
        return;
      }

      // Remove existing docker directory
      fs.rmSync(dockerDir, { recursive: true, force: true });
    }

    console.log('📁 Creating docker directory...');
    fs.mkdirSync(dockerDir);

    // Use nodePlop to generate the Docker configuration
    const plop = await nodePlop(path.resolve(__dirname, '../../templates/plopfile.js'));
    const generator = plop.getGenerator('docker-setup');
    await generator.runActions({ 
      cwd: process.cwd(),
      odooVersion: odooVersion,
      postgresVersion: postgresVersion,
      moduleName: moduleName
    });

    console.log('✨ Docker setup added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
} 