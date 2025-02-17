import { createResponse } from 'itty-router';

export const js = createResponse('application/javascript; charset=utf-8', (data: any) => data);
export const css = createResponse('text/css; charset=utf-8', (data: any) => data);
export const jsonp = createResponse(
  'application/javascript; charset=utf-8',
  (data: any) => `jsonpCallback(${JSON.stringify(data)});`,
);

export const mp4 = createResponse('video/mp4', (data: any) => data);
export const webm = createResponse('video/webm', (data: any) => data);
