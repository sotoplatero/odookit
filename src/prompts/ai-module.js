// Prompt para generar la estructura del módulo
export function getModuleStructurePrompt(name, type, description) {
  return `You are an expert Odoo developer. Create a detailed module structure for an Odoo module with these requirements:

Name: ${name}
Type: ${type}
Description:
${description}

Provide the response in this JSON format:
{
  "models": [
    {
      "name": "model.name",
      "fields": [
        {"name": "field_name", "type": "field.type", "required": boolean, "help": "description"}
      ],
      "description": "model purpose"
    }
  ],
  "views": [
    {
      "type": "view_type",
      "model": "model.name",
      "fields": ["field1", "field2"],
      "description": "view purpose"
    }
  ],
  "security": {
    "groups": ["group names"],
    "access_rights": ["model access descriptions"]
  },
  "menus": [
    {
      "name": "Menu Name",
      "parent": "parent.menu",
      "action": "action type and model"
    }
  ]
}`;
}

// Prompt para generar el código del módulo
export function getModuleCodePrompt(moduleStructure, name, type) {
  return `Generate the complete Odoo module code based on this structure:
${JSON.stringify(moduleStructure, null, 2)}

For a ${type} module named ${name}.

Include:
1. __manifest__.py with all dependencies
2. Python models with fields and methods
3. XML views and actions
4. Security files (ir.model.access.csv and groups)
5. ${type === 'frontend' ? 'JavaScript and CSS files' : 'Any additional backend logic needed'}

Provide the response as a JSON with file paths and contents:
{
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "file contents"
    }
  ]
}`;
}
