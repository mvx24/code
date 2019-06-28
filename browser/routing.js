import { h, createRef } from './dom';

const routerRef = createRef();
const routerParams = {};
const routes = [];
let defaultRoute = <p>Error: 404</p>;
const port = location.port ? `:${location.port}` : '';
const origin = location.origin || `${location.protocol}//${location.hostname}${port}`;

function compilePath(path) {
  if (path) {
    const params = [];
    const pattern = path.replace(/:([^/]*)/gi, (m, param) => {
      params.push(param);
      return '([^/]*)';
    });
    const regex = new RegExp(`^${pattern}$`, 'i');
    return { params, regex };
  }
  return {};
}

function matchPath(path) {
  Object.keys(routerParams).forEach(param => {
    delete routerParams[param];
  });
  for (let i = 0; i < routes.length; ++i) {
    const route = routes[i];
    const { regex, params } = route;
    if (regex && regex.test(path)) {
      const match = path.match(regex);
      for (let j = 0; j < params.length; ++j) {
        routerParams[params[j]] = match[j + 1];
      }
      return route.vnode;
    }
  }
  return defaultRoute;
}

const Router = ({ children }) => {
  children.forEach(child => {
    child.attributes = child.attributes || {};
    routes.push(
      Object.assign(
        {
          path: child.attributes.path,
          vnode: child,
        },
        compilePath(child.attributes.path),
      ),
    );
    if (child.attributes.default) defaultRoute = child;
  });
  document.addEventListener('click', e => {
    const { target } = e;
    if (target && target.href && target.href.substr(0, origin.length) === origin) {
      const pathname = target.href.substr(origin.length);
      history.pushState(null, '', pathname);
      routerRef.current = matchPath(
        pathname
          .split('?')
          .shift()
          .split('#')
          .shift(),
      );
      e.preventDefault();
      e.stopPropagation();
    }
  });
  window.onpopstate = () => {
    routerRef.current = matchPath(location.pathname);
  };
  const component = matchPath(location.pathname);
  const { ref } = component.attributes;
  component.attributes.ref = el => {
    routerRef(el);
    if (ref) {
      ref(el);
      component.attributes.ref = ref;
    } else {
      delete component.attributes.ref;
    }
  };
  return component;
};

export { Router, routerRef, routerParams };
