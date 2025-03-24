import { isSSR } from './ssr';
import { hydrate, prerender as ssr } from 'preact-iso';
import './index.css';
import App from './App.tsx';
import { ContainerNode } from 'preact';

if (!isSSR()) {
  hydrate(<App />, document.getElementById('root') as unknown as ContainerNode);
}

export async function prerender(data: Record<string, unknown>) {
  return await ssr(<App {...data} />);
}
