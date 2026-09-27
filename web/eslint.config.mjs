import v3xlabs from 'eslint-plugin-v3xlabs';

export default [
    {
        ignores: ['node_modules', 'dist', 'build', '**/*.gen.ts'],
    },
    ...v3xlabs.configs.recommended,
    ...v3xlabs.configs.solid,
];
