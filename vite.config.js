import { defineConfig } from "vite";

export default defineConfig({
    root: "src",
    base: "/",
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
});
