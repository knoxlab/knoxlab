const fs = require("fs");
const vm = require("vm");
const dir = "F:/文档/项目文档/PowerCMS 12/市场推广/网站";
const pages = ["index.html", "ai.html", "product.html", "solutions.html", "solutions-hub.html",
  "solutions-media.html", "customers.html", "pricing.html", "developer.html", "contact.html"];
const code = fs.readFileSync(dir + "/js/i18n.js", "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const dicts = sandbox.window.I18N;
let fail = 0;
const usedKeys = new Set();
const rawHtml = {};
for (const p of pages) {
  const html = fs.readFileSync(dir + "/" + p, "utf8");
  rawHtml[p] = html;
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

/* ------------------------------------------------------------------
 * 值漂移检查（value drift）
 * 页面渲染时 data-i18n 会用词典值 innerHTML 覆盖 HTML 内置默认文案，
 * 所以「HTML 改了、词典没改」= 线上不生效（pricing.html 专业版价格曾中招）。
 * 做法：取 HTML 元素的可见文本（去标签/实体/空白）与词典 zh 值同法归一后比对。
 * ---------------------------------------------------------------- */
function norm(s) {
  return String(s)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function innerOf(html, tag, contentStart) {
  const re = /<(\/?)([A-Za-z][\w-]*)([^>]*?)(\/?)>/g;
  re.lastIndex = contentStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[2].toLowerCase() !== tag) continue;
    if (m[4] === "/") continue;              // 自闭合
    if (m[1] === "/") { depth--; if (depth === 0) return html.slice(contentStart, m.index); }
    else depth++;
  }
  return null;
}

const zh = dicts.zh || {};
const drift = new Map();
for (const p of pages) {
  const html = rawHtml[p];
  const re = /<([A-Za-z][\w-]*)((?:[^>"]|"[^"]*")*?data-i18n="([^"]+)"[^>]*?)>/g;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const key = m[3];
    if (["br", "img", "input", "meta", "link", "hr"].includes(tag)) continue;
    const inner = innerOf(html, tag, m.index + m[0].length);
    if (inner === null) continue;
    const htmlText = norm(inner);
    const dictText = norm(zh[key]);
    if (!htmlText || !dictText) continue;
    if (htmlText !== dictText) {
      if (!drift.has(key)) drift.set(key, { page: p, htmlText, dictText });
    }
  }
}

const strict = process.argv.includes("--strict");
if (drift.size) {
  if (strict) fail++;
  console.log("\n[zh] VALUE DRIFT: HTML 默认文案与词典值不一致（共 " + drift.size + " 处，" +
    (strict ? "严格模式计为失败" : "仅提示，加 --strict 可转为失败") + "）");
  console.log("  说明：默认语言 zh 直接渲染 HTML 文案；词典值只在「切到英文再切回中文」时生效，");
  console.log("        两者不一致 = 同一段文案随语言切换而变化。");
  for (const [key, v] of drift) {
    console.log("  " + key + "  (" + v.page + ")");
    console.log("    HTML: " + v.htmlText.slice(0, 120));
    console.log("    DICT: " + v.dictText.slice(0, 120));
  }
} else {
  console.log("[zh] value drift = 0");
}

process.exit(fail ? 1 : 0);
