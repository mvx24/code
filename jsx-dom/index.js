import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { h, render } from 'utils/dom';

import './index.css';

document.addEventListener('DOMContentLoaded', () => {
  render(<h1>Hello World!</h1>, window.document.getElementById('root'));
});
