import { h, createRef } from './dom';
import { parseQueryString } from './params';

const routerRef = createRef();
const routes = [];
let routerParams;
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
  routerParams = {};
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

function createState(path, data = {}) {
  const parts = path.split('?');
  const query = parts.length > 1 ? parseQueryString(path.substr(parts[0].length)) : {};
  return { data, route: routerParams, query };
}

function navigate(path, data) {
  const [pathname] = path.split('?');
  if (pathname.toLowerCase() === location.pathname) {
    const state = createState(path, data || (history.state && history.state.data));
    history.replaceState(state, '', path);
  } else {
    const component = matchPath(path.split('?')[0]);
    const state = createState(path, data);
    history.pushState(state, '', path);
    routerRef.current = component;
  }
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
      navigate(target.href.substr(origin.length), Object.assign({}, target.dataset));
      e.preventDefault();
      e.stopPropagation();
    }
  });

  window.onpopstate = () => {
    routerRef.current = matchPath(location.pathname);
  };

  const component = matchPath(location.pathname);
  if (!history.state) {
    const dataEl = document.getElementById('data');
    if (dataEl) {
      const path = location.href.substr(origin.length);
      history.replaceState(createState(path, JSON.parse(dataEl.innerHTML)), '', path);
    }
  }

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

export { navigate, Router, routerRef };
