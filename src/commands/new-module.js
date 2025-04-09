import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function newModuleCommand(options) {
  try {
    // Verificar que estamos en un proyecto Odoo
    if (!fs.existsSync('docker-compose.yml')) {
      console.error('❌ Error: Must be run from an Odoo project directory (docker-compose.yml not found)');
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Module name:',
        default: options.name,
        validate: input => {
          if (input.trim().length === 0) {
            return 'Module name cannot be empty';
          }
          if (!/^[a-zA-Z0-9_]+$/.test(input)) {
            return 'Module name can only contain letters, numbers and underscores';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'type',
        message: 'Module type:',
        default: options.type,
        choices: [
          { name: 'Backend (Python/XML)', value: 'backend' },
          { name: 'Frontend (JS/CSS/XML)', value: 'frontend' }
        ]
      }
    ]);

    // Verificar/crear el directorio addons
    if (!fs.existsSync('addons')) {
      console.log('📁 Creating addons directory...');
      fs.mkdirSync('addons');
      fs.writeFileSync('addons/.gitkeep', '');
    }

    const moduleDir = path.join('addons', answers.name);
    if (fs.existsSync(moduleDir)) {
      console.error(`❌ Error: Module ${answers.name} already exists`);
      return;
    }

    // Copiar template según el tipo
    const templateDir = path.resolve(__dirname, `../../templates/module-${answers.type}`);
    fs.cpSync(templateDir, moduleDir, { recursive: true });

    // Renombrar archivos y reemplazar placeholders
    const files = fs.readdirSync(moduleDir);
    for (const file of files) {
      const filePath = path.join(moduleDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const newContent = content.replace(/\{\{name\}\}/g, answers.name);
      fs.writeFileSync(filePath, newContent);
    }

    console.log(`
✨ Module created successfully!

Module information:
- Name: ${answers.name}
- Type: ${answers.type}
- Location: ${moduleDir}

Next steps:
1. Edit __manifest__.py to add your module information
2. Start adding your models and views
3. Restart Odoo server and install the module

Happy coding! 🚀
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
