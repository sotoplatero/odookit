import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function updateModuleCommand(module, options) {
  try {
    // Verificar que estamos en un proyecto Odoo
    if (!fs.existsSync('docker-compose.yml')) {
      console.error('❌ Error: Must be run from an Odoo project directory (docker-compose.yml not found)');
      return;
    }

    // Si no se proporciona el módulo, listar los disponibles
    if (!module) {
      const addonsDir = path.join(process.cwd(), 'addons');
      if (!fs.existsSync(addonsDir)) {
        console.error('❌ Error: No modules found (addons directory does not exist)');
        return;
      }

      const modules = fs.readdirSync(addonsDir)
        .filter(dir => fs.statSync(path.join(addonsDir, dir)).isDirectory())
        .filter(dir => !dir.startsWith('.'));

      if (modules.length === 0) {
        console.error('❌ Error: No modules found in addons directory');
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'module',
          message: 'Select module to update:',
          choices: modules
        }
      ]);
      module = answers.module;
    }

    // Verificar que el módulo existe
    const moduleDir = path.join('addons', module);
    if (!fs.existsSync(moduleDir)) {
      console.error(`❌ Error: Module ${module} not found`);
      return;
    }

    // Actualizar el subtree
    console.log('🔧 Updating module...');
    const prefix = `addons/${module}`;
    const branch = options.branch ? `-b ${options.branch}` : '';
    const repository = options.repository ? options.repository : '';

    await execAsync(`git subtree pull --prefix ${prefix} ${repository} ${branch} --squash`);

    console.log(`
✨ Module updated successfully!

Module information:
- Name: ${module}
- Location: ${moduleDir}
${repository ? `- Repository: ${repository}` : ''}
${options.branch ? `- Branch: ${options.branch}` : ''}

Next steps:
1. Restart Odoo server
2. Update the module in Odoo

Happy coding! 🚀
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
