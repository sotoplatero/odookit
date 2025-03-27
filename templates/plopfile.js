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
        prompts: [],
        actions: [
            {
                type: 'addMany',
                destination: '{{name}}',
                base: 'project',
                templateFiles: 'project/**/*',
                globOptions: {
                    dot: true
                },
                data: {
                    odooPort: '{{odooPort}}',
                    odooImage: '{{odooImage}}'
                }
            }
        ]
    });

    // Frontend module generator
    plop.setGenerator('module-frontend', {
        description: 'Create a new frontend Odoo module',
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

    // Backend module generator
    plop.setGenerator('module-backend', {
        description: 'Create a new backend Odoo module',
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
};
