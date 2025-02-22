import assert from 'assert';
import renderTemplate from '../src/renderTemplate';

// Test variations of template rendering
assert.strictEqual(renderTemplate('Hello, {{name}}!', { name: 'world' }), 'Hello, world!');
assert.strictEqual(renderTemplate('Hello, {%name%}!', { name: '& world' }), 'Hello, &amp; world!');

// Test if blocks
const template = `
Hello {{ name }},

{% if isCool %}
You are cool!
{% endif %}

{% if isAdmin %}
You are an admin!
{% endif %}
`;

const adminContext = {
  name: 'Test User',
  isCool: true,
  isAdmin: false,
};

const notCoolContext = {
  name: 'Not Cool User',
  isCool: false,
  isAdmin: true,
};

let rendered = renderTemplate(template, adminContext);
assert(rendered.includes('Hello Test User'));
assert(rendered.includes('You are cool!'));
assert(!rendered.includes('You are an admin!'));
rendered = renderTemplate(template, notCoolContext);
assert(rendered.includes('Hello Not Cool User'));
assert(!rendered.includes('You are cool!'));
assert(rendered.includes('You are an admin!'));
