import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// Q2.10: one input family. Screens use TextInput, Select, Textarea, Checkbox, Radio from
// apps/web/src/ui/form, never a raw tag (square corners, thin border, own font).
const rawControls = ["input", "select", "textarea"].map((tag) => ({
  selector: `JSXOpeningElement[name.name='${tag}']`,
  message: `Use the shared form control from ui/form instead of a raw <${tag}>.`,
}));

export default defineConfig([
  globalIgnores(["**/node_modules/", "**/dist/", "**/.wrangler/", "**/worker-configuration.d.ts"]),
  tseslint.configs.recommended,
  {
    files: ["apps/web/src/features/**/*.tsx"],
    rules: { "no-restricted-syntax": ["error", ...rawControls] },
  },
]);
