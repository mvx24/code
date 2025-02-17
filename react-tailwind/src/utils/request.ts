type Data = URLSearchParams | Record<string, unknown> | FormData;

function request(method: string, path: string, data?: Data, anonymous = false): Promise<Data> {
  const opts: RequestInit = {
    method,
    mode: 'same-origin',
    credentials: 'include',
    cache: 'no-cache',
    redirect: 'follow',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
  const headers = opts.headers as Record<string, string>;

  // Add the auth token
  if (!anonymous) {
    const auth = localStorage.getItem('auth') || sessionStorage.getItem('auth');
    if (!auth) {
      throw new Error('Cannot reach server - unauthorized.');
    }
    headers.Authorization = `Bearer ${JSON.parse(auth).access_token}`;
  }

  // Encode the body
  if (method !== 'GET' && data) {
    if (data instanceof FormData) {
      const encoded = [];
      let hasFile = false;
      for (const entry of data) {
        if (entry[1] instanceof File) {
          hasFile = true;
          break;
        }
        encoded.push(`${entry[0]}=${encodeURIComponent(entry[1])}`);
      }
      if (hasFile) {
        // Multi-part form data for file uploads
        opts.body = data;
      } else {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        opts.body = encoded.join('&');
      }
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
  }

  // Create the url
  let query;
  if (method === 'GET' && data) {
    if (data instanceof URLSearchParams) {
      query = data.toString();
    } else if (typeof data === 'object') {
      query = new URLSearchParams(data as Record<string, string>).toString();
    }
  }
  const url = query ? `${path}?${query}` : path;

  // Make the request
  return fetch(url, opts).then(response => {
    if (response.status === 204) {
      return Promise.resolve();
    }
    if (!response.ok) {
      if (
        response.headers.has('Content-Type') &&
        response.headers.get('Content-Type')!.indexOf('application/json') > -1
      ) {
        return response.json().then(err => {
          throw new Error(err.message);
        });
      }
      return response.text().then(txt => {
        throw new Error(txt);
      });
    }
    return response.json();
  });
}

const create = (path: string, data: Data) => request('POST', path, data);
const read = (path: string, params: URLSearchParams | Record<string, string>) =>
  request('GET', path, params);
const update = (path: string, data: Data) => request('PUT', path, data);
const destroy = (path: string) => request('DELETE', path);
const patch = (path: string, data: Data) => request('PATCH', path, data);

export { request, create, read, update, destroy, patch };
