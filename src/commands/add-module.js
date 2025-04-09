import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function addModuleCommand(repository, options) {
  try {
    // Verificar que estamos en un proyecto Odoo
    if (!fs.existsSync('docker-compose.yml')) {
      console.error('❌ Error: Must be run from an Odoo project directory (docker-compose.yml not found)');
      return;
    }

    // Si no se proporciona el repositorio, preguntar
    if (!repository) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'repository',
          message: 'Git repository URL:',
          validate: input => {
            if (input.trim().length === 0) {
              return 'Repository URL cannot be empty';
            }
            if (!input.includes('github.com') && !input.includes('gitlab.com') && !input.includes('bitbucket.org')) {
              return 'Please provide a valid Git repository URL';
            }
            return true;
          }
        }
      ]);
      repository = answers.repository;
    }

    // Obtener el nombre del módulo del repositorio
    const moduleName = path.basename(repository, '.git');

    // Verificar que el módulo no existe
    const moduleDir = path.join('addons', moduleName);
    if (fs.existsSync(moduleDir)) {
      console.error(`❌ Error: Module ${moduleName} already exists`);
      return;
    }

    // Verificar/crear el directorio addons
    if (!fs.existsSync('addons')) {
      console.log('📁 Creating addons directory...');
      fs.mkdirSync('addons');
      fs.writeFileSync('addons/.gitkeep', '');
    }

    // Agregar el subtree
    console.log('🔧 Adding module as git subtree...');
    const prefix = `addons/${moduleName}`;
    const targetRepo = options.repository || repository;
    const branch = options.branch ? `-b ${options.branch}` : '';

    await execAsync(`git subtree add --prefix ${prefix} ${targetRepo} ${branch} --squash`);

    console.log(`
✨ Module added successfully!

Module information:
- Name: ${moduleName}
- Location: ${moduleDir}
- Repository: ${targetRepo}
${options.branch ? `- Branch: ${options.branch}` : ''}

To update the module later:
odookit update:module ${moduleName}

Next steps:
1. Restart Odoo server
2. Update module list in Odoo
3. Install the module from Apps menu

Happy coding! 🚀
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
