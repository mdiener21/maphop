import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "VITE_");

    return {
        root: "src",
        envDir: ".",
        base: "./",
        define: {
            "import.meta.env.VITE_THUNDERFOREST_API_KEY": JSON.stringify(env.VITE_THUNDERFOREST_API_KEY ?? "")
        },
        build: {
            outDir: "../dist",
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: new URL("./src/index.html", import.meta.url).pathname,
                    impressum: new URL("./src/impressum.html", import.meta.url).pathname,
                    settings: new URL("./src/settings.html", import.meta.url).pathname
                }
            }
        }
    };
});
