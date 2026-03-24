import { defineConfig } from "vite";

export default defineConfig({
    root: "src",
    base: "/mymap/",
    build: {
        outDir: "../dist",
        emptyOutDir: true
    }
});
