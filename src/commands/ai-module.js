import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { OpenAIService } from '../services/openai.js';
import { getModuleStructurePrompt, getModuleCodePrompt } from '../prompts/ai-module.js';

export async function aiModuleCommand(options) {
  try {
    // Verificar API key de OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ Error: OPENAI_API_KEY environment variable is required');
      console.log('\nPlease set your OpenAI API key:');
      console.log('export OPENAI_API_KEY=your_api_key_here');
      return;
    }

    // Verificar que estamos en un proyecto Odoo
    if (!fs.existsSync('docker-compose.yml')) {
      console.error('❌ Error: Must be run from an Odoo project directory (docker-compose.yml not found)');
      return;
    }

    // Verificar/crear el directorio addons
    if (!fs.existsSync('addons')) {
      console.log('📁 Creating addons directory...');
      fs.mkdirSync('addons');
      fs.writeFileSync('addons/.gitkeep', '');
    }

    // Preguntar por los detalles del módulo
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
      },
      {
        type: 'editor',
        name: 'description',
        message: 'Describe your module requirements (features, models, views, etc):',
        default: options.description || '# Module Requirements\n\nDescribe what you want your module to do...',
        validate: input => {
          if (input.trim().length < 10) {
            return 'Please provide a more detailed description';
          }
          return true;
        }
      }
    ]);

    const openai = new OpenAIService(apiKey);

    console.log('\n🤖 Analyzing requirements...');

    // Generar la estructura del módulo
    const structurePrompt = getModuleStructurePrompt(
      answers.name,
      answers.type,
      answers.description
    );

    const moduleStructure = await openai.generateModuleStructure(structurePrompt);

    // Generar el código del módulo
    console.log('🔨 Generating module code...');

    const codePrompt = getModuleCodePrompt(
      moduleStructure,
      answers.name,
      answers.type
    );

    const moduleCode = await openai.generateModuleCode(codePrompt);

    // Crear el módulo
    console.log('📝 Creating module files...');

    const moduleDir = path.join('addons', answers.name);
    if (fs.existsSync(moduleDir)) {
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

      fs.rmSync(moduleDir, { recursive: true, force: true });
    }

    // Crear los archivos del módulo
    for (const file of moduleCode.files) {
      const filePath = path.join(moduleDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content);
    }

    console.log(`
✨ Module created successfully!

Module information:
- Name: ${answers.name}
- Type: ${answers.type}
- Location: ${moduleDir}

Generated components:
- Models: ${moduleStructure.models.length}
- Views: ${moduleStructure.views.length}
- Security groups: ${moduleStructure.security.groups.length}
- Menu items: ${moduleStructure.menus.length}

To install the module:
1. Restart your Odoo server
2. Update module list in Odoo
3. Install the module from Apps menu

Happy coding! 🚀
`);

  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ Error: Invalid OpenAI API key');
    } else {
      console.error('❌ Error:', error.message);
      if (error.response?.data) {
        console.error('Details:', error.response.data);
      }
    }
  }
}
