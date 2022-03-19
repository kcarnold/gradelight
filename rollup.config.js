import {nodeResolve} from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
    input: "./editor.ts",
    output: {
        file: "./editor.bundle.js",
        sourcemap: true,
        format: "iife"
    },
    plugins: [nodeResolve(), typescript({
        compilerOptions: {target: "es6"}
    })]
};
