import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./tailwind.css";
import { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export const loader: LoaderFunction = async () => {
  return json({
    ENV: {
      RECAPTCHA_SITE_KEY: process.env.VITE_RECAPTCHA_SITE_KEY,
    },
  });
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

const queryClient = new QueryClient();

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleReCaptchaProvider
          reCaptchaKey={ENV.RECAPTCHA_SITE_KEY}
          scriptProps={{
            async: false,
            defer: true,
            appendTo: "head",
            nonce: undefined,
          }}
        >
        <Outlet />
      </GoogleReCaptchaProvider>
    </QueryClientProvider>
  );
}
