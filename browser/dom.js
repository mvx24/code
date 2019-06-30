/**
 * h, render, and createRef functions for using JSX without a framework.
 */

function flatten(arr) {
  for (let i = 0; i < arr.length; ++i) {
    if (Array.isArray(arr[i])) arr.splice(i, 1, ...flatten(arr[i]));
  }
  return arr;
}

const logicalAttrs = {
  callback: 1,
  default: 1,
  path: 1,
  ref: 1,
};

function h(nodeName, attributes, ...childNodes) {
  const children = flatten(childNodes)
    .filter(c => c !== undefined && c !== null && c !== false)
    .reduce((rc, c) => {
      if (c.nodeName) rc.push(c);
      else if (typeof rc[rc.length - 1] === 'string') rc[rc.length - 1] += String(c);
      else rc.push(String(c));
      return rc;
    }, []);
  if (typeof nodeName === 'function') {
    const vnode = nodeName(Object.assign({ children }, attributes));
    if (attributes) {
      Object.keys(attributes).forEach(attr => {
        if (logicalAttrs[attr]) {
          vnode.attributes = vnode.attributes || {};
          vnode.attributes[attr] = attributes[attr];
        }
      });
    }
    return vnode;
  }
  return {
    nodeName,
    attributes,
    children,
  };
}

const svgNamespace = 'http://www.w3.org/2000/svg';
const xlinkNamespace = 'http://www.w3.org/1999/xlink';
const xlinkAttrs = {
  href: 1,
  show: 1,
  title: 1,
};
const attrMap = {
  className: 'class',
  htmlFor: 'for',
};

function render(vnode, target, rerender, insideSvg) {
  const isSvg = insideSvg || vnode.nodeName === 'svg';
  const el = isSvg
    ? document.createElementNS(svgNamespace, vnode.nodeName)
    : document.createElement(vnode.nodeName || 'div');
  if (vnode.attributes) {
    for (const attr in vnode.attributes) {
      let value = vnode.attributes[attr];
      if (value && typeof value === 'object') {
        for (const key in value) {
          el[attr][key] = value[key];
        }
      } else if (typeof value === 'function') {
        if (!attr.indexOf('on')) {
          el.addEventListener(attr.substr(2).toLowerCase(), value);
        } else if (attr === 'ref') {
          value(el);
        } else if (attr === 'callback') {
          // eslint-disable-next-line
          const ref = createRef();
          ref(el);
          const replacement = value(ref);
          if (replacement) return render(replacement, target, rerender, insideSvg);
        }
      } else if (value) {
        value = value === true ? '' : value;
        if (isSvg && xlinkAttrs[attr]) {
          el.setAttributeNS(xlinkNamespace, attr, value);
        } else if (isSvg && attr === 'lang') {
          el.setAttributeNS(svgNamespace, attr, value);
        } else if (!logicalAttrs[attr]) {
          el.setAttribute(attrMap[attr] || attr, value);
        }
      }
    }
  }
  if (vnode.children) {
    vnode.children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        render(child, el, false, isSvg);
      }
    });
  }
  if (target) {
    if (rerender) while (target.firstChild) target.firstChild.remove();
    target.appendChild(el);
  }
  return el;
}

function createRef() {
  let current = null;
  const ref = function(el) {
    current = el;
  };
  Object.defineProperty(ref, 'current', {
    get: () => current,
    set: vnode => {
      const el = render(vnode);
      current.parentElement.replaceChild(el, current);
      current = el;
    },
  });
  return ref;
}

export { h, render, createRef };
