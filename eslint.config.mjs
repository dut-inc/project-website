import nextConfig from "eslint-config-next";

// .venv is the local Python environment for scripts/root; it is not ours to lint.
const eslintConfig = [{ ignores: [".venv/**"] }, ...nextConfig];

export default eslintConfig;
