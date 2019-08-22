module.exports = {
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
    plugins: ["@typescript-eslint"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        sourceType: "module"
    },
    rules: {
        "prettier/prettier": [
            "error",
            {
                printWidth: 150,
                tabWidth: 4
            }
        ]
    }
};
