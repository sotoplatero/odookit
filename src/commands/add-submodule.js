import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const isGitRepo = () => {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const initGitRepo = async () => {
  const { init } = await inquirer.prompt([{
    type: 'confirm',
    name: 'init',
    message: 'This is not a Git repository. Would you like to initialize one?',
    default: true
  }]);

  if (init) {
    execSync('git init');
    console.log(chalk.green('✓ Git repository initialized'));
    return true;
  }
  return false;
};

const getModuleNameFromRepo = (repoUrl) => {
  // Extraer el nombre del módulo del URL del repositorio
  const repoName = repoUrl.split('/').pop().replace('.git', '');
  return repoName;
};

export const addSubmoduleCommand = async (options) => {
  try {
    // Verificar si es un repositorio git
    if (!isGitRepo()) {
      const initialized = await initGitRepo();
      if (!initialized) {
        console.log(chalk.red('Cannot proceed without a Git repository'));
        return;
      }
    }

    // Solicitar URL del repositorio si no se proporcionó
    let { repository } = await inquirer.prompt([{
      type: 'input',
      name: 'repository',
      message: 'Enter the Git repository URL for the addon:',
      when: !options.repository
    }]);

    repository = options.repository || repository;
    
    // Extraer el nombre del módulo y crear la ruta
    const moduleName = getModuleNameFromRepo(repository);
    const addonsDir = 'addons';
    const targetDir = join(addonsDir, moduleName);

    // Crear directorio addons si no existe
    if (!existsSync(addonsDir)) {
      console.log(chalk.blue(`Creating addons directory...`));
      mkdirSync(addonsDir, { recursive: true });
    }

    // Verificar si el submódulo ya existe
    if (existsSync(targetDir)) {
      console.log(chalk.yellow(`Warning: Directory ${targetDir} already exists`));
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Do you want to proceed anyway?',
        default: false
      }]);

      if (!proceed) {
        console.log(chalk.red('Operation cancelled'));
        return;
      }
    }

    // Agregar el submódulo
    console.log(chalk.blue(`Adding submodule from ${repository} to ${targetDir}...`));
    
    execSync(`git submodule add ${repository} ${targetDir}`);
    execSync('git submodule update --init --recursive');

    console.log(chalk.green('✓ Submodule added successfully'));
    console.log(chalk.green('✓ Submodule initialized and updated'));
    console.log(chalk.blue(`Module location: ${targetDir}`));

  } catch (error) {
    console.error(chalk.red('Error adding submodule:'), error.message);
  }
}; 