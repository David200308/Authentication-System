import type { LoaderFunction, ActionFunction } from "@remix-run/node";

const ORIGIN = import.meta.env.VITE_PUBLIC_BACKEND_URL;

const proxyRequest = (request: Request) => {
    const { pathname } = new URL(request.url.split("/api").join(""));
    const { href } = new URL(pathname, ORIGIN);

    return new Request(href, request);
};

export const loader: LoaderFunction = async ({ request }) =>
    fetch(proxyRequest(request));

export const action: ActionFunction = ({ request }) =>
    fetch(proxyRequest(request));
