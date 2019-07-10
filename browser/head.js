import { h, render } from './dom';

const renderedMeta = document.querySelector('meta[name="head"]');
let root = null;
let count = renderedMeta ? parseInt(renderedMeta.getAttribute('content')) : 0;

function renderHead(meta, children) {
  const currentRoot = root || document.querySelector('title');
  const fragment = document.createDocumentFragment();
  children.forEach(c => render(c, fragment));
  // Remove the root's (count-1) siblings with children
  while (count > 1) {
    root.nextElementSibling.remove();
    --count;
  }
  // Set and remember the new head info
  root = fragment.firstElementChild;
  count = fragment.childElementCount;
  currentRoot.parentElement.replaceChild(fragment, currentRoot);
  meta.setAttribute('content', count);
}

const Head = ({ children }) => (
  <meta name="head" callback={ref => renderHead(ref.current, children)} />
);

export default Head;
