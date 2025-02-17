import path from 'path';
import * as fs from 'fs';

import { html, json } from 'itty-router';

import renderTemplate from '../renderTemplate';

type TemplateContext = Record<string, unknown>;

export default function serveTemplate(templateName: string, context?: TemplateContext) {
  const dir = path.resolve(process.cwd(), './templates');
  const template = fs.readFileSync(path.join(dir, templateName), 'utf8');
  const rendered = renderTemplate(template, context || {});
  return templateName.endsWith('.json') ? json({ rendered }) : html(rendered);
}
