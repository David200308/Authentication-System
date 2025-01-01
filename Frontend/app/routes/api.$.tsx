import type { LoaderFunction, ActionFunction } from "@remix-run/node";

const ORIGIN = import.meta.env.VITE_PUBLIC_BACKEND_URL;

const proxyRequest = (request: Request) => {
  const { pathname } = new URL(request.url.split("/api").join(""));
  const { href } = new URL(pathname, ORIGIN);
  
  const headers = new Headers(request.headers);

  console.log('ips: ', request.headers.get('x-forwarded-for'), request.headers.get('cf-connecting-ip'), request.headers.get('x-real-ip'));
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip');
  
  headers.set('Host', ORIGIN.split('//')[1]);
  headers.set('x-client-request-ip', ip || '');
  headers.set('origin', request.headers.get('origin')!);
  
  return new Request(href, {
    method: request.method,
    headers: headers,
    body: request.body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    integrity: request.integrity,
  });
};

export const loader: LoaderFunction = async ({ request }) => {
  const proxyReq = proxyRequest(request);
  return fetch(proxyReq);
};

export const action: ActionFunction = async ({ request }) => {
  const proxyReq = proxyRequest(request);
  return fetch(proxyReq);
};
