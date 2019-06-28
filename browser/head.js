import { h, render } from './dom';

let root = null;
let count = 0;

function renderHead(children) {
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
}

const Head = ({ children }) => <meta name="head" callback={() => renderHead(children)} />;

export default Head;
