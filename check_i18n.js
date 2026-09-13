const fs = require("fs");
const vm = require("vm");
const dir = "F:/文档/项目文档/PowerCMS 12/市场推广/网站";
const pages = ["index.html", "product.html", "solutions.html", "customers.html", "pricing.html"];
const code = fs.readFileSync(dir + "/js/i18n.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const dicts = sandbox.window.I18N;
let fail = 0;
const usedKeys = new Set();
for (const p of pages) {
  const html = fs.readFileSync(dir + "/" + p, "utf8");
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) usedKeys.add(m[1]);
}
for (const lang of ["zh", "en"]) {
  const d = dicts[lang] || {};
  const missing = [...usedKeys].filter(k => !(k in d));
  const unused = Object.keys(d).filter(k => !usedKeys.has(k));
  console.log("[" + lang + "] used=" + usedKeys.size + " defined=" + Object.keys(d).length + " missingInDict=" + missing.length + " unusedInDict=" + unused.length);
  if (missing.length) { fail++; console.log("  MISSING:", missing.join(", ")); }
  if (unused.length) console.log("  unused (harmless):", unused.join(", "));
}
// 额外检查：zh 词典值应与 HTML 内置中文一致（抽样：父级包含嵌套 i18n 的情况）
process.exit(fail ? 1 : 0);
