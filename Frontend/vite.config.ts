import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, import.meta.dirname) };
	const backendUrl = process.env.VITE_PUBLIC_BACKEND_URL;
	if (!backendUrl) throw new Error('Add `VITE_PUBLIC_BACKEND_URL` to the .env file');
	return {
		plugins: [
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
        },
      }),
      tsconfigPaths(),
    ],
    server: {
      proxy: { 
        '/user': { 
          target: backendUrl, 
          changeOrigin: true 
        } 
      } 
    },
	};
});
