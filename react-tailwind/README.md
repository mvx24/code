# Other sources for hooks:

https://github.com/alibaba/hooks/tree/master/packages/hooks/src
https://github.com/mantinedev/mantine/tree/master/packages/%40mantine/hooks/src
https://github.com/tailwindlabs/headlessui/tree/main/packages/%40headlessui-react/src/hooks
https://react-spectrum.adobe.com/react-aria/hooks.html

# Building with Preact

Preact is able to do prerendering where all HTML is rendered to the file and then hydrated once loaded on the page see main.tsx

Previous main.tsx react code:

```
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Setup

- tsconfig.app.json - aliases are needed for the VS code TS LSP to properly understand the imports and types
- vite.config.ts - needs aliasing for actual building
- vite.config.ts - also needs `preact({ prerender: { enabled: true, renderTarget: '#root' } })` imported from `'@preact/preset-vite'`
- Previously was just set to `react()` imported from `'@vitejs/plugin-react-swc'`

Aliases should be used and all files aside from the use of preact-iso etc should try to use react natively for reuseability

### Comparison vs NextJS

A basic Next JS project outputs a lot of JS files shown below and the uncompressed size just to load a simple webpage with a couple lines of text is
472Kb. In comparison a this bigger multi-page app is only a single JS file and is 62Kb uncompressed to load.

Also see more reasons to not use NextJS https://northflank.com/blog/why-we-ditched-next-js-and-never-looked-back

```
out
out/_next
out/_next/ImCK8gOtLkW5M-rifVjxC
out/_next/static
out/_next/static/ImCK8gOtLkW5M-rifVjxC
out/_next/static/ImCK8gOtLkW5M-rifVjxC/_ssgManifest.js
out/_next/static/ImCK8gOtLkW5M-rifVjxC/_buildManifest.js
out/_next/static/css
out/_next/static/css/7b0f04f30930ab71.css
out/_next/static/chunks
out/_next/static/chunks/4bd1b696-0a8ef173c8cc3937.js
out/_next/static/chunks/app
out/_next/static/chunks/app/_not-found
out/_next/static/chunks/app/_not-found/page-f08302ee705a96b1.js
out/_next/static/chunks/app/page-edd8a1cd23e16208.js
out/_next/static/chunks/app/layout-153c7d26582528a4.js
out/_next/static/chunks/684-743c728056879557.js
out/_next/static/chunks/main-2dfae1cd8aeec202.js
out/_next/static/chunks/63-efd6f4e4fc8e1bcf.js
out/_next/static/chunks/webpack-20a8446f813eece4.js
out/_next/static/chunks/framework-ffa29026f1c46b06.js
out/_next/static/chunks/main-app-cd29a71e6c7982d2.js
out/_next/static/chunks/pages
out/_next/static/chunks/pages/_error-cc3f077a18ea1793.js
out/_next/static/chunks/pages/_app-da15c11dea942c36.js
out/_next/static/chunks/polyfills-42372ed130431b0a.js
out/_next/static/media
out/_next/static/media/ba015fad6dcf6784-s.woff2
out/_next/static/media/747892c23ea88013-s.woff2
out/_next/static/media/569ce4b8f30dc480-s.p.woff2
out/_next/static/media/93f479601ee12b01-s.p.woff2
out/favicon.ico
out/index.html
out/file.svg
out/index.txt
out/404.html
out/vercel.svg
out/next.svg
out/globe.svg
out/window.svg
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react';

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```
