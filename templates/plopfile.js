export default function (plop) {
    // Helpers
    plop.setHelper('pascalCase', (text) => {
        return text.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    });

    plop.setHelper('snakeCase', (text) => {
        return text.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    });

    plop.setHelper('titleCase', (text) => {
        return text.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    });

    // Project generator
    plop.setGenerator('project', {
        description: 'Create a new Odoo project',
        prompts: [], // Las preguntas las maneja el comando
        actions: [
            {
                type: 'addMany',
                destination: '{{projectDir}}',
                base: 'project',
                templateFiles: 'project/**/*',
                globOptions: {
                    dot: true
                }
            },
            {
                type: 'add',
                path: '{{projectDir}}/addons/.gitkeep',
                template: ''
            },
            {
                type: 'add',
                path: '{{projectDir}}/backups/.gitkeep',
                template: ''
            },
            {
                type: 'add',
                path: '{{projectDir}}/config/.gitkeep',
                template: ''
            },
            {
                type: 'add',
                path: '{{projectDir}}/data/.gitkeep',
                template: ''
            }
        ]
    });

    // Backend module generator
    plop.setGenerator('module-backend', {
        description: 'Create a new Odoo backend module',
        prompts: [],
        actions: [
            {
                type: 'addMany',
                destination: '{{name}}',
                base: 'module-backend',
                templateFiles: 'module-backend/**/*',
                globOptions: {
                    dot: true
                }
            }
        ]
    });

    // Frontend module generator
    plop.setGenerator('module-frontend', {
        description: 'Create a new Odoo frontend module',
        prompts: [],
        actions: [
            {
                type: 'addMany',
                destination: '{{name}}',
                base: 'module-frontend',
                templateFiles: 'module-frontend/**/*',
                globOptions: {
                    dot: true
                }
            }
        ]
    });
};
