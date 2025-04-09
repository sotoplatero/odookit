import OpenAI from 'openai';

export class OpenAIService {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  async generateModuleStructure(prompt) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert Odoo developer assistant. Provide only valid JSON responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async generateModuleCode(prompt) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert Odoo developer assistant. Generate production-ready Odoo module code. Provide only valid JSON responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
