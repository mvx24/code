// For elements that cannot be focused with the autofocus attribute
export default function focus(el: HTMLElement) {
  // Add tabindex for elements that normally don't support focus and remove the webkit outline
  if (el) {
    if (!el.getAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
      el.style.outline = 'none';
    }
    el.focus();
  }
}
