import type { LoaderFunction, ActionFunction } from "@remix-run/node";

const ORIGIN = import.meta.env.VITE_PUBLIC_BACKEND_URL;

const proxyRequest = (request: Request) => {
  const { pathname } = new URL(request.url.split("/api").join(""));
  const { href } = new URL(pathname, ORIGIN);
  
  const headers = new Headers(request.headers);
  
  headers.set('Host', ORIGIN.split('//')[1]);
  
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
