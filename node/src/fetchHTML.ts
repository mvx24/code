const USER_AGENT =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Safari/605.1.15';

export default function fetchHTML(url: string): Promise<string> {
  const { hostname } = new URL(url);
  return fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': USER_AGENT },
  }).then(response => response.text());
}
