/* 冒烟测试：加载全部页面，捕获 JS 错误，校验 AI 组件渲染 */
const { chromium } = require("playwright");
const path = require("path");
const dir = "F:/文档/项目文档/PowerCMS 12/市场推广/网站";
const pages = ["index.html", "ai.html", "product.html", "solutions.html", "solutions-hub.html",
  "solutions-media.html", "pricing.html", "customers.html", "developer.html", "contact.html"];

(async () => {
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { browser = await chromium.launch({ channel: "msedge" }); }
  let fail = 0;
  for (const p of pages) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", e => errs.push("pageerror: " + e.message));
    page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
    await page.goto("file:///" + path.join(dir, p).replace(/\\/g, "/"), { waitUntil: "load" });
    await page.waitForTimeout(400);

    const info = await page.evaluate(() => ({
      fab: !!document.querySelector(".ai-fab"),
      navAi: !!document.querySelector('[data-i18n="nav.ai"]'),
      footAi: !!document.querySelector('[data-i18n="footer.l10"]'),
      search: (document.querySelector("#demo-search .res-item") || {}).length,
      searchRows: document.querySelectorAll("#demo-search .res-item").length,
      askCites: document.querySelectorAll("#demo-ask .cite").length,
      edOps: document.querySelectorAll("#demo-editor .ed-ops button").length,
      pipeSteps: document.querySelectorAll("#demo-pipe .pipe-step").length,
      recCards: document.querySelectorAll("#demo-rec .rec-card").length
    }));

    const bad = errs.length > 0 || !info.fab || !info.navAi || !info.footAi;
    if (bad) fail++;
    console.log(
      (bad ? "FAIL " : "ok   ") + p.padEnd(21) +
      " fab=" + info.fab + " nav=" + info.navAi + " foot=" + info.footAi +
      " searchRows=" + info.searchRows + " askCites=" + info.askCites +
      " edOps=" + info.edOps + " pipe=" + info.pipeSteps + " rec=" + info.recCards +
      (errs.length ? "\n      " + errs.join("\n      ") : "")
    );
    await ctx.close();
  }

  // ai.html 深度交互测试
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  await page.goto("file:///" + path.join(dir, "ai.html").replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForTimeout(400);

  // 切 tab
  for (const t of ["s2", "s3", "s4", "s5"]) {
    await page.click('.tab[data-tab="' + t + '"]');
    await page.waitForTimeout(150);
  }
  // 审核流水线
  await page.click('.tab[data-tab="s4"]');
  await page.waitForTimeout(200);
  await page.click('[data-run]');
  await page.waitForTimeout(5200);
  const pipeDone = await page.evaluate(() =>
    document.querySelectorAll("#demo-pipe .pipe-step.done").length);
  // AI 编辑
  await page.click('.tab[data-tab="s3"]');
  await page.click("#demo-editor .ed-ops button:nth-child(1)");
  await page.waitForTimeout(1500);
  const edText = await page.evaluate(() =>
    (document.querySelector('#demo-editor [data-v="title"]') || {}).textContent || "");
  // 语义检索
  await page.click('.tab[data-tab="s1"]');
  await page.fill("#demo-search input", "国产化环境怎么部署");
  await page.click("#demo-search .btn");
  await page.waitForTimeout(300);
  const hy = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#demo-search [data-hy] .rt")).map(e => e.textContent));
  // AI 助手
  await page.click(".ai-fab");
  await page.waitForTimeout(300);
  await page.fill(".ai-panel input", "AI 能力有哪些？");
  await page.click(".ai-panel .send");
  await page.waitForTimeout(400);
  const botMsg = await page.evaluate(() => {
    const m = document.querySelectorAll(".ai-chat .ai-msg:not(.user) .bubble");
    return m.length > 1 ? m[m.length - 1].textContent.slice(0, 60) : "NONE";
  });
  // 拒答测试
  await page.fill(".ai-panel input", "量子加密通信支持吗");
  await page.click(".ai-panel .send");
  await page.waitForTimeout(300);
  const refuse = await page.evaluate(() => {
    const m = document.querySelectorAll(".ai-chat .ai-msg:not(.user) .bubble");
    return m.length ? m[m.length - 1].textContent.slice(0, 30) : "NONE";
  });
  // 英文切换（先关闭助手面板）
  await page.click(".ai-panel .ah-close");
  await page.waitForTimeout(200);
  await page.click('.lang-toggle button[data-lang="en"]');
  await page.waitForTimeout(500);
  const enTitle = await page.evaluate(() =>
    (document.querySelector('[data-i18n="a.hero.title"]') || {}).textContent);
  const enPipe = await page.evaluate(() =>
    document.querySelectorAll("#demo-pipe .pipe-step").length);

  console.log("\n--- ai.html 深度交互 ---");
  console.log("pipe done steps :", pipeDone, pipeDone === 5 ? "OK" : "FAIL");
  console.log("editor output   :", JSON.stringify(edText.slice(0, 40)), edText.length > 10 ? "OK" : "FAIL");
  console.log("hybrid results  :", hy.length, JSON.stringify(hy.slice(0, 2)));
  console.log("assistant answer:", JSON.stringify(botMsg));
  console.log("assistant refuse:", JSON.stringify(refuse));
  console.log("EN hero title   :", JSON.stringify((enTitle || "").slice(0, 45)));
  console.log("EN pipe steps   :", enPipe);
  console.log("errors          :", errs.length ? errs.join(" | ") : "none");
  if (errs.length || pipeDone !== 5 || edText.length <= 10) fail++;

  await browser.close();
  console.log("\nRESULT:", fail ? fail + " FAILURE(S)" : "ALL OK");
  process.exit(fail ? 1 : 0);
})();
