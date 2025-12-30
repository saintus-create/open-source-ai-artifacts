import 'server-only'
import templates from './templates.json'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export default templates
export type Templates = typeof templates
export type TemplateId = keyof typeof templates
export type TemplateConfig = typeof templates[TemplateId]

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates).map(([id, t], index) => `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`).join('\n')}`
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

export function verifyTemplateIntegrity(templateId: TemplateId): boolean {
  const template = templates[templateId];
  if (!('integrity' in template)) return true; // No integrity check if not defined

  const templatePath = path.join(process.cwd(), 'sandbox-templates', templateId);
  if (!fs.existsSync(templatePath)) return false;

  const files = getAllFiles(templatePath).sort();
  const hashSum = crypto.createHash('sha256');

  try {
    files.forEach(file => {
      const fileBuffer = fs.readFileSync(file);
      hashSum.update(fileBuffer.toString());
    });

    const computedHash = hashSum.digest('hex');
    return computedHash === template.integrity;
  } catch (error) {
    return false;
  }
}

export function getTemplateIntegrity(templateId: TemplateId): string | null {
  const template = templates[templateId];
  return 'integrity' in template ? template.integrity : null;
}
