import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const config = {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'es',
        name: 'tournament-organizer',
        entryFileNames: '[name].module.js',
        globals: {
            crypto: 'require$$0'
        }
    },
    plugins: [
        commonjs(),
        nodePolyfills({
            sourceMap: true
        }),
        nodeResolve(),
        typescript()
    ]
};

export default config;
