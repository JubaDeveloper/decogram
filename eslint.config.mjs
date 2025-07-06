// @ts-check

import tseslint from "typescript-eslint";

export default tseslint.config(
	...tseslint.configs.stylistic,
	{
		rules: {
			"quotes": ["error", "double"],
			"padding-line-between-statements": [
				"error",
				{ "blankLine": "always", "prev":  "*", "next": "*" },
				{ "blankLine": "never", "prev":  "import", "next": "import" }
			],
			"@typescript-eslint/no-this-alias": "off",
			"@typescript-eslint/no-namespace": "off",
			"indent": ["error", "tab"]
		}
	}
);
