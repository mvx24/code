type Data = Record<string, unknown>;
type TemplateContext = Record<string, unknown>;

function get(obj: Data, path: string, stringify = false): unknown {
  const val = path.split('.').reduce((acc: any, key: string) => acc?.[key], obj);
  if (stringify) {
    if (Array.isArray(val)) {
      return val.join('\n');
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      return JSON.stringify(val, null, 2);
    }
  }
  return val;
}

function formatHTML(val?: any): string {
  const str: string = val?.toString() ?? '';
  const tagMap: { [char: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '\n': '<br />',
  };
  return str.replace(/[&<>"'\n]/g, tag => tagMap[tag]);
}

function formatText(val?: any): string {
  if (Array.isArray(val)) {
    return val.join(', ');
  }
  return val?.toString() ?? '';
}

/** Simple template rendering with {{var}} and {% if var %} formatting */
export function renderTemplate(template: string, context: TemplateContext): string {
  // Recursively evaluate {% for ... in %} {% endforeach %} blocks
  // then evaluate {% if ... %} {% endif %} blocks
  // then interpolate remaining {% variable %} formatted html blocks or {{ variable }} formatted text blocks
  const rendered = template
    .replace(/\{% for (.*?) in (.*?) %}(.*?){% endfor %}/gs, (_, val, arrayName, content) => {
      const array = get(context, arrayName);
      if (!Array.isArray(array)) {
        return '';
      }
      return array
        .map((e: unknown, idx: number) => renderTemplate(content, { [val]: e, idx, ...context }))
        .join('');
    })
    .replace(/\{% if (.*?) %}(.*?){% endif %}/gs, (_, condition, content) => {
      if (!context[condition]) {
        return '';
      }
      return renderTemplate(content, context);
    })
    .replace(/\{%\W*(.*?)\W*%\}/g, (_, key) => formatHTML(get(context, key, true)))
    .replace(/\{\{\W*(.*?)\W*\}\}/g, (_, key) => formatText(get(context, key)));

  return rendered;
}
