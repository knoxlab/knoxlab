/* ==========================================================================
   PowerCMS 12 官网 - AI 能力交互层
   1) 全站悬浮「AI 站内助手」：本地语料 + 混合检索 + 引用溯源 + 证据不足拒答
   2) ai.html 五组可交互演示：语义检索对比 / 溯源问答 / AI 辅助编辑 / 自动化审核 / 智能推荐
   全部为纯前端离线实现，不发起任何外部请求，数据不出浏览器。
   ========================================================================== */
(function () {
  "use strict";

  /* ================= 语言 ================= */
  function lang() {
    var l = document.documentElement.getAttribute("lang");
    return l && l.indexOf("en") === 0 ? "en" : "zh";
  }
  function L(v) { return v[lang() === "en" ? 1 : 0]; }
  function idx() { return lang() === "en" ? 1 : 0; }

  /* ================= 检索工具 ================= */
  function tokenize(s) {
    s = String(s || "").toLowerCase().replace(/[\s　]+/g, " ");
    var out = [];
    // 拉丁词
    var words = s.match(/[a-z0-9][a-z0-9\.\-\+#]*/g) || [];
    for (var i = 0; i < words.length; i++) if (words[i].length > 1) out.push(words[i]);
    // CJK 二元组（同时保留单字以覆盖极短查询）
    var cjk = s.replace(/[a-z0-9\.\-\+#\s]/g, "");
    for (var j = 0; j < cjk.length; j++) {
      out.push(cjk.charAt(j));
      if (j + 1 < cjk.length) out.push(cjk.substr(j, 2));
    }
    return out;
  }
  function uniq(arr) {
    var m = {}, r = [];
    for (var i = 0; i < arr.length; i++) { if (!m[arr[i]]) { m[arr[i]] = 1; r.push(arr[i]); } }
    return r;
  }

  /* ================= AI 语料（答案事实源） ================= */
  /* 字段顺序：[中文, English] */
  var CORPUS = [
    {
      id: "ai-overview",
      t: ["PowerCMS 12 的 AI 能力总览", "AI capabilities in PowerCMS 12"],
      k: ["ai 能力", "人工智能", "能力域", "总览", "ai overview", "capability"],
      a: ["PowerCMS 12 内置 9 大 AI 能力域：可配置大模型底座、编辑器内 AI 创作、语义检索与溯源问答、GEO 生成式引擎优化、媒体智能、MCP 对外接入、智能体工作流、AI 审计与治理、多源内容融合 —— 覆盖从模型底座到审计治理的完整链路。",
        "PowerCMS 12 ships nine AI capability domains: configurable model gateway, in-editor AI authoring, semantic search and cited Q&A, GEO optimization, media intelligence, MCP integration, agent workflows, AI audit and governance, and multi-source content fusion."],
      s: ["AI 战略与能力全景", "AI Strategy & Capability Map"],
      u: "ai.html#caps"
    },
    {
      id: "ai-switch",
      t: ["站点级 AI 总开关", "Site-level AI master switch"],
      k: ["总开关", "开关", "默认关闭", "按需开启", "master switch", "off by default"],
      a: ["AI 能力由站点级总开关控制，默认关闭、按需开启。开启后所有模型调用计入配额与审计，不产生无主的 AI 行为；关闭后平台退化为纯人工内容流程，功能不受影响。",
        "AI is governed by a site-level master switch that is off by default and enabled on demand. Once on, every model call is counted against quota and written to the audit log — there is no unattributable AI activity."],
      s: ["AI 治理护栏", "AI Governance Guardrails"],
      u: "ai.html#governance"
    },
    {
      id: "ai-model",
      t: ["可配置大模型底座", "Configurable model gateway"],
      k: ["大模型", "模型", "通义", "文心", "deepseek", "智谱", "kimi", "豆包", "openai", "claude", "byok", "适配", "model", "llm"],
      a: ["统一 OpenAI 兼容适配层，通义 / 文心 / DeepSeek / 智谱 / Kimi / 豆包与 OpenAI / Claude 均按配置接入；支持私有化部署、数据不出内网，BYOK 站点级密钥隔离。",
        "A single OpenAI-compatible adapter layer connects Qwen, ERNIE, DeepSeek, GLM, Kimi, Doubao, OpenAI and Claude by configuration. Deployment stays on-premises, data never leaves the intranet, and BYOK keys are isolated per site."],
      s: ["九大 AI 能力域 · 01", "Nine AI Domains · 01"],
      u: "ai.html#caps"
    },
    {
      id: "ai-private",
      t: ["数据不出域与私有化", "Data residency and on-premises"],
      k: ["数据不出域", "私有化", "内网", "不出机房", "数据主权", "on premise", "data residency", "sovereignty"],
      a: ["平台私有化部署于客户机房，模型调用走内网或客户自有密钥，媒体转写默认使用本地 Whisper。全链路无第三方 Cookie，第一方采集数据同样不出机房。",
        "The platform is deployed inside the customer's data center. Model calls travel the intranet or use the customer's own keys, media transcription runs on local Whisper by default, and first-party analytics never leave the premises either."],
      s: ["部署与合规", "Deployment & Compliance"],
      u: "ai.html#governance"
    },
    {
      id: "ai-editor",
      t: ["编辑器内 AI 创作", "In-editor AI authoring"],
      k: ["编辑器", "创作", "续写", "改写", "扩写", "缩写", "摘要", "纠错", "润色", "翻译", "editor", "rewrite", "translate", "summar"],
      a: ["字段级 AI 支持续写 / 改写 / 扩写 / 缩写 / 摘要 / 纠错 / 润色与 20+ 语言翻译；标题、摘要、关键词智能建议，结果以「插入 / 替换」回填并可二次编辑。",
        "Field-level AI supports continue, rewrite, expand, condense, summarize, proofread, polish and translation across 20+ languages, plus smart suggestions for titles, excerpts and keywords. Output is inserted or replaced and stays fully editable."],
      s: ["九大 AI 能力域 · 02", "Nine AI Domains · 02"],
      u: "ai.html#demo"
    },
    {
      id: "ai-schema",
      t: ["schema-aware 输出校验", "Schema-aware output validation"],
      k: ["schema", "校验", "结构化", "字段", "内容类型", "validation", "structured"],
      a: ["AI 输出按内容类型 schema 校验后才可落库：长度、类型、必填、枚举逐项检查；关系字段候选由服务端枚举，禁止模型凭空生成 ID。校验不通过的内容不进入版本历史。",
        "Model output must pass the content-type schema before it is persisted: length, type, required and enum are all checked. Relation candidates are enumerated server-side so the model can never invent an ID. Failed output never enters version history."],
      s: ["AI 内容生产闭环", "AI Content Production Loop"],
      u: "ai.html#demo"
    },
    {
      id: "ai-draft",
      t: ["AI 自动起草与审批", "AI drafting and approval"],
      k: ["自动起草", "起草", "草稿", "审批", "批量", "异步", "draft", "automat", "approval"],
      a: ["按栏目规则自动起草并自动提交审批；批量任务异步执行，进度可查、可续跑。AI 建议态内容在人工确认前不进入版本历史，确认动作本身留审计。",
        "Content is drafted automatically per section rules and submitted for approval in the same pass. Batch jobs run asynchronously with resumable progress. AI-suggested content stays out of version history until a human confirms it — and that confirmation is audited."],
      s: ["智能体工作流", "Agent Workflows"],
      u: "ai.html#agent"
    },
    {
      id: "ai-search",
      t: ["语义检索与混合检索", "Semantic and hybrid search"],
      k: ["语义检索", "语义搜索", "向量", "混合检索", "bm25", "knn", "bge-m3", "检索", "semantic search", "hybrid", "vector", "embedding"],
      a: ["内容保存或发布时自动向量化（默认 bge-m3 / 1024 维）并增量更新，支持全量重建且不中断检索。默认 BM25 0.4 + k-NN 0.6 混合检索，权重可按站点覆盖，向量检索 P95 ≤ 300 ms。",
        "Content is vectorized on save or publish (bge-m3 / 1024 dims by default) and updated incrementally; full rebuilds run without interrupting search. Default hybrid weighting is BM25 0.4 + k-NN 0.6, overridable per site, with vector search P95 ≤ 300 ms."],
      s: ["九大 AI 能力域 · 03", "Nine AI Domains · 03"],
      u: "ai.html#demo"
    },
    {
      id: "ai-ask",
      t: ["溯源问答与引用门禁", "Cited Q&A and citation gate"],
      k: ["问答", "溯源", "引用", "拒答", "rag", "答案", "cited", "citation", "refuse", "grounded"],
      a: ["站内问答答案携带引用条目与版本，引用必须命中本次 top-k 检索上下文；出处不足时明确拒答，不编造。访客问答只检索已发布内容，后台问答按对象级 ACL 检索草稿。",
        "Answers carry citations with entry and version, and every citation must hit the current top-k context. When evidence is insufficient the system explicitly refuses rather than fabricating. Visitor Q&A searches published content only; back-office Q&A respects object-level ACL on drafts."],
      s: ["九大 AI 能力域 · 03", "Nine AI Domains · 03"],
      u: "ai.html#demo"
    },
    {
      id: "ai-geo",
      t: ["GEO 生成式引擎优化", "Generative engine optimization"],
      k: ["geo", "生成式引擎", "json-ld", "schema.org", "meta", "结构化标记", "标签", "seo", "structured data"],
      a: ["自动生成 schema.org JSON-LD 结构化标记并随页面与 API 响应输出；智能标签与分类对齐 TAG / CATEGORY 体系，Meta 描述自动生成并做 SimHash 重复度检测，让内容在 AI 搜索中可发现、可正确引用。",
        "schema.org JSON-LD is generated automatically and emitted with both pages and API responses. Smart tags align to the TAG/CATEGORY taxonomy, meta descriptions are auto-written and checked with SimHash for duplication — so content is discoverable and correctly cited by AI search."],
      s: ["九大 AI 能力域 · 04", "Nine AI Domains · 04"],
      u: "ai.html#caps"
    },
    {
      id: "ai-media",
      t: ["媒体智能", "Media intelligence"],
      k: ["媒体智能", "转写", "whisper", "字幕", "章节", "关键帧", "ocr", "以图搜图", "alt", "视频", "transcription", "subtitle", "media"],
      a: ["视频自动转写默认使用本地 Whisper，数据不出域并带 AI 标识；自动生成摘要与智能章节、srt 字幕，提取关键帧与图片 Alt 文本，支持图片与扫描件 OCR。媒体语义检索与以图搜图由媒体服务器向量索引承担，CMS 侧回写结构化字段。",
        "Video transcription uses local Whisper by default — data stays in-domain and output is labelled as AI-generated. Summaries, smart chapters and SRT subtitles are produced automatically, along with keyframes, image alt text and OCR. Semantic media search and image-to-image retrieval are served by the media server's vector index, with structured fields written back to the CMS."],
      s: ["九大 AI 能力域 · 05", "Nine AI Domains · 05"],
      u: "product.html"
    },
    {
      id: "ai-mcp",
      t: ["MCP 对外接入", "MCP integration"],
      k: ["mcp", "工具", "71", "智能体", "agent", "tools", "resources", "prompts", "协议"],
      a: ["内置一个双传输并存的 MCP Server，提供 Tools / Resources / Prompts 三类能力，共 71 个结构化工具，覆盖建模、模板、内容、媒体、流程、站点六大域；工具清单带版本可演进，标准 MCP 客户端即插即用。",
        "A built-in MCP Server exposes Tools, Resources and Prompts over two transports simultaneously: 71 structured tools across modelling, templates, content, media, workflow and site domains. The tool manifest is versioned and evolvable, so any standard MCP client just plugs in."],
      s: ["MCP 工具面 × 智能体生态", "MCP Tool Surface & Agent Ecosystem"],
      u: "ai.html#mcp"
    },
    {
      id: "ai-token",
      t: ["Token 三级权限", "Three-tier token permissions"],
      k: ["token", "权限", "l0", "l1", "l2", "只读", "草稿", "发布", "scope", "permission"],
      a: ["Token 分 L0 只读 / L1 草稿 / L2 发布三级，只能收窄不能扩大，越级调用一律 403 并落审计；API Token 还可限定站点、环境、Scope、有效期与来源。",
        "Tokens are tiered L0 read-only / L1 draft / L2 publish and can only be narrowed, never widened. Out-of-tier calls return 403 and are written to the audit log. Tokens can also be scoped by site, environment, scope list, validity window and origin."],
      s: ["MCP 治理底线", "MCP Governance Baseline"],
      u: "ai.html#mcp"
    },
    {
      id: "ai-write",
      t: ["写操作三段式", "Three-stage write operations"],
      k: ["三段式", "写操作", "dry-run", "预览", "凭据", "sha-256", "diff", "回滚", "write", "credential", "dry run"],
      a: ["写操作遵循「生成 → 预览 / Diff → 携凭据落库」三段式。审批凭据绑定 Diff 摘要（SHA-256），30 分钟有效、一次性消费，过期或被拒即失效；破坏性操作无凭据一律拒绝。另配幂等键防重复提交与乐观锁防并发覆盖。",
        "Writes follow a three-stage flow: generate → preview/diff → persist with credential. Approval credentials are bound to the diff digest (SHA-256), valid for 30 minutes and single-use; expired or rejected credentials fail closed. Idempotency keys prevent duplicate submits and optimistic locking prevents concurrent overwrites."],
      s: ["MCP 治理底线", "MCP Governance Baseline"],
      u: "ai.html#mcp"
    },
    {
      id: "ai-agent",
      t: ["智能体工作流", "Agent workflows"],
      k: ["智能体", "工作流", "自动化", "调度发布", "异常回滚", "运营洞察", "agent", "workflow", "orchestrat"],
      a: ["AI 是工作流的一等参与者：自动起草并提交审批、审批辅助摘要、规则化调度发布、异常自动回滚、运营洞察报告与多智能体协同编排，全部走与人工动作一致的留痕口径。",
        "AI is a first-class participant in workflows: drafting and submitting for approval, summarizing for reviewers, rule-based scheduled publishing, automatic rollback on anomalies, operations insight reports and multi-agent orchestration — all recorded with the same audit semantics as human actions."],
      s: ["九大 AI 能力域 · 07", "Nine AI Domains · 07"],
      u: "ai.html#agent"
    },
    {
      id: "ai-audit",
      t: ["AI 审计与治理", "AI audit and governance"],
      k: ["审计", "治理", "防篡改", "提示注入", "标识", "深度合成", "合规", "audit", "governance", "prompt injection", "watermark"],
      a: ["AI 参与标识、防篡改追加审计、独立版本与一键回滚、提示注入防护、站点级 AI 总开关，以及深度合成内容的显式与隐式标识合规，构成可写进招标文件的治理能力。",
        "AI participation labelling, tamper-evident append-only audit, independent versions with one-click rollback, prompt-injection defenses, a site-level master switch, and explicit plus implicit labelling for synthetic media — governance you can write into a tender document."],
      s: ["AI 治理护栏", "AI Governance Guardrails"],
      u: "ai.html#governance"
    },
    {
      id: "ai-fusion",
      t: ["多源内容融合", "Multi-source content fusion"],
      k: ["多源", "dam", "pim", "知识图谱", "可信度", "融合", "知识库", "fusion", "knowledge graph", "trust"],
      a: ["接入外部 DAM（图片 / 视频 / PDF / CAD）与 PIM（型号 / 参数 / 规格），映射为内容字段或内容关系；跨源关系建模 + 内容可信度治理（来源 / 版本 / 审批 / 有效期 / 可信等级），构成企业 AI 的内容事实源。",
        "External DAM (images, video, PDF, CAD) and PIM (model, parameters, specs) assets are mapped to content fields or relations. Cross-source relation modelling plus content trust governance — source, version, approval state, validity, trust tier — make this the fact source for enterprise AI."],
      s: ["九大 AI 能力域 · 09", "Nine AI Domains · 09"],
      u: "ai.html#caps"
    },
    {
      id: "ai-recommend",
      t: ["智能内容推荐", "Smart content recommendation"],
      k: ["推荐", "个性化", "画像", "相关内容", "推荐位", "recommend", "personaliz", "related content"],
      a: ["基于第一方行为数据（无第三方 Cookie）、内容语义相似度与业务规则生成推荐位，编辑可在可视化编辑器中直接干预排序与兜底策略，推荐结果可解释、可回放。",
        "Recommendations combine first-party behavioural data (no third-party cookies), content semantic similarity and business rules. Editors can override ranking and fallback strategy directly in the visual editor; every result is explainable and replayable."],
      s: ["AI 内容生产闭环", "AI Content Production Loop"],
      u: "ai.html#demo"
    },
    {
      id: "ai-moderation",
      t: ["自动化内容审核", "Automated content moderation"],
      k: ["审核", "合规", "敏感词", "风险摘要", "四眼", "先审后发", "机审", "moderation", "compliance", "review"],
      a: ["提交即触发 AI 合规预检：敏感词同步预检、事实性与重复度检测、深度合成标识校验，并产出审批风险摘要；随后进入人工四眼审批与会签，先审后发 / 先发后审双层策略可配，全流程留痕。",
        "Submission triggers AI pre-checks: synchronized sensitive-word screening, factuality and duplication detection, synthetic-media label verification — plus an approval risk summary. Human four-eyes approval and co-signing follow, with configurable pre-publish or post-publish review and full audit coverage."],
      s: ["自动化审核流水线", "Automated Review Pipeline"],
      u: "ai.html#demo"
    },
    {
      id: "perf",
      t: ["性能与容量基线", "Performance and capacity baselines"],
      k: ["性能", "p95", "并发", "容量", "基线", "延迟", "performance", "latency", "baseline"],
      a: ["管理读取 API 100 并发下 P95 ≤ 800 ms；交付内容 API 缓存命中 P95 ≤ 200 ms、未命中 P95 ≤ 600 ms；访客搜索 P95 ≤ 800 ms；单站点支持 ≥ 100 万内容、≥ 10 万页面路由；100 个受影响页面增量发布 ≤ 5 分钟。",
        "Management read API P95 ≤ 800 ms at 100 concurrency; delivery API P95 ≤ 200 ms cached and ≤ 600 ms uncached; visitor search P95 ≤ 800 ms. A single site supports ≥ 1M content items and ≥ 100k page routes, with 100 changed pages published incrementally in ≤ 5 minutes."],
      s: ["技术规格与验收基线", "Technical Specification & Acceptance"],
      u: "product.html"
    },
    {
      id: "deploy",
      t: ["部署与技术栈", "Deployment and technology stack"],
      k: ["部署", "技术栈", "java", "spring boot", "postgresql", "opensearch", "信创", "国产化", "deploy", "stack"],
      a: ["后端 Java 21 + Spring Boot 3.5 模块化单体，数据层 PostgreSQL（业务权威源）+ OpenSearch（管理与访客双索引），管理端 React 18 + TypeScript + Vite；发布目标支持本地 / Nginx 版本目录与 Git 专用分支，兼容国产化运行环境。",
        "Backend is Java 21 + Spring Boot 3.5 as a modular monolith, data layer is PostgreSQL (system of record) plus OpenSearch (separate management and visitor indexes), admin UI is React 18 + TypeScript + Vite. Publish targets include local/Nginx version directories and a dedicated Git branch, with domestic-platform compatibility."],
      s: ["技术规格与服务", "Technical Specification & Services"],
      u: "developer.html"
    },
    {
      id: "migration",
      t: ["存量系统迁移", "Legacy system migration"],
      k: ["迁移", "平迁", "v11", "url", "模板转换", "对账", "回退", "migration", "upgrade"],
      a: ["V11 迁移工具链源系统全程只读，支持断点续迁与增量补迁；覆盖 8 种数据库方言，模板 100% 自动转换（语法树解析，未登记标签一律阻断），旧 URL 全量兼容（原样 200 或一次 301），逐域对账并生成回退包。",
        "The V11 migration toolkit keeps the source system strictly read-only and supports resumable and incremental re-runs. It covers eight database dialects, converts templates 100% automatically via syntax-tree parsing (unregistered tags are blocked, never guessed), keeps every legacy URL working (verbatim 200 or a single 301), reconciles domain by domain and produces a rollback package."],
      s: ["存量迁移护城河", "Legacy Migration Moat"],
      u: "product.html"
    },
    {
      id: "security",
      t: ["权限与安全治理", "Permissions and security"],
      k: ["权限", "acl", "对象级", "沙箱", "隔离", "防篡改", "越权", "security", "permission", "sandbox"],
      a: ["对象级 ACL 覆盖组织 → 站点 → 栏目 → 内容类型 → 内容 / 媒体，五种权利可继承亦可打破继承；模板脚本沙箱、隔离构建 Worker、管理索引与访客索引物理隔离、防篡改追加审计，服务端对象级授权防越权。",
        "Object-level ACL spans organization → site → section → content type → content/media, with five inheritable or breakable rights. Template script sandboxing, isolated build workers, physically separated management and visitor indexes, tamper-evident append-only audit, and server-side object-level authorization prevent cross-boundary access."],
      s: ["治 · 治理与智能", "Governance & Intelligence"],
      u: "product.html"
    },
    {
      id: "publish",
      t: ["确定性发布工程", "Deterministic release engineering"],
      k: ["发布", "回滚", "release", "artifact", "deployment", "原子切换", "增量", "静态", "publish", "rollback"],
      a: ["Release / Artifact / Deployment 三级不可变事实模型：产物写入版本目录后原子切换 current 指针，发布中断旧站持续可用；回滚重新验证产物与索引后切换，历史产物不可变。按依赖图计算受影响页面做增量静态生成。",
        "A three-tier immutable fact model — Release / Artifact / Deployment. Artifacts are written to a versioned directory, then the current pointer is flipped atomically; an interrupted release leaves the old site serving. Rollback re-validates artifacts and indexes before switching, and historical artifacts are immutable. Changed pages are computed from the dependency graph for incremental static generation."],
      s: ["发 · 交付与发布", "Delivery & Release"],
      u: "product.html"
    },
    {
      id: "analytics",
      t: ["第一方统计与洞察", "First-party analytics"],
      k: ["统计", "分析", "pv", "uv", "cookie", "播放行为", "洞察", "analytics", "tracking"],
      a: ["零第三方 Cookie 的第一方采集，访客数据匿名化、不出机房；覆盖 PV / UV、访问趋势、来源与客户端分析、栏目逐级下钻、视频完播率与退出分布、实时在线监控与发布工作量统计。",
        "First-party collection with zero third-party cookies, anonymized visitors and data that never leaves the data center: PV/UV, trend and referrer analysis, client and loyalty analysis, drill-down by section, video completion and drop-off distribution, real-time monitoring and publishing workload metrics."],
      s: ["治 · 治理与智能", "Governance & Intelligence"],
      u: "product.html"
    },
    {
      id: "pricing",
      t: ["价格方案与 AI 分层", "Plans and AI tiers"],
      k: ["价格", "报价", "版本", "套餐", "多少钱", "费用", "试用", "price", "pricing", "plan", "cost"],
      a: ["提供标准版 / 专业版 / 企业版 / 旗舰版四档，AI 能力按版本分层开放：标准版不含 AI，专业版开放编辑器 AI 创作与智能标签，企业版追加语义检索、溯源问答与 MCP 工具面，旗舰版含媒体智能与多源融合。AI 调用计入站点配额。",
        "Four tiers are available — Standard, Professional, Enterprise and Ultimate — with AI layered by plan: Standard excludes AI, Professional unlocks in-editor authoring and smart tagging, Enterprise adds semantic search, cited Q&A and the MCP tool surface, Ultimate includes media intelligence and multi-source fusion. Model calls count against site quota."],
      s: ["价格方案", "Pricing"],
      u: "pricing.html"
    },
    {
      id: "trial",
      t: ["预约演示与试用", "Book a demo"],
      k: ["演示", "试用", "联系", "咨询", "预约", "demo", "trial", "contact", "book"],
      a: ["可在「预约演示」页提交需求，我们提供售前技术交流、POC 验证支持与私有化安装指导；演示环境可现场体验 AI 起草、语义检索、溯源问答与 MCP 一句话管全站。",
        "Submit your requirements on the demo page and we provide pre-sales technical exchange, POC validation support and on-premises installation guidance. The demo environment covers AI drafting, semantic search, cited Q&A and one-sentence site management over MCP."],
      s: ["联系我们", "Contact"],
      u: "contact.html"
    },
    {
      id: "a11y",
      t: ["无障碍与多语言", "Accessibility and languages"],
      k: ["无障碍", "wcag", "多语言", "国际化", "i18n", "键盘", "读屏", "accessibility", "language"],
      a: ["管理端核心流程满足 WCAG 2.1 AA（键盘导航、焦点管理、对比度、读屏兼容）；管理界面 6 种语言，内容多语言支持显式回退链，时间统一 UTC 存储、按站点时区显示。",
        "Core admin flows meet WCAG 2.1 AA (keyboard navigation, focus management, contrast, screen-reader support). The admin UI ships in six languages, content localization uses explicit fallback chains, and timestamps are stored in UTC and rendered in site time zone."],
      s: ["技术规格与服务", "Technical Specification & Services"],
      u: "product.html"
    },
    {
      id: "backup",
      t: ["可用性与灾备", "Availability and DR"],
      k: ["可用性", "备份", "rpo", "rto", "灾备", "高可用", "availability", "backup", "recovery"],
      a: ["静态站点独立于管理面，管理面故障不影响线上访问；备份 RPO 15 分钟、管理面 RTO 4 小时，发布与回滚可配置双人审批。",
        "The static site is independent of the management plane, so a management outage never affects live traffic. Backup RPO is 15 minutes and management-plane RTO is 4 hours; publish and rollback can require two-person approval."],
      s: ["技术规格与服务", "Technical Specification & Services"],
      u: "product.html"
    },
    {
      id: "modeling",
      t: ["企业级内容建模", "Enterprise content modelling"],
      k: ["建模", "内容类型", "字段", "关系", "版本", "时间机器", "modeling", "content type", "field", "relation"],
      a: ["19 类字段控件 + 3 类结构控件拖拽即成编辑表单；四类对象 PAGE / COMPONENT / SHARED / MEDIA 边界清晰，内容关系支持双向 1:1 / 1:N / N:1 / N:N 与自引用；每次保存生成不可变版本，支持字段级差异对比、一键恢复与时间机器回溯。",
        "19 field widgets and 3 structural widgets drag into an editing form. Four object types — PAGE / COMPONENT / SHARED / MEDIA — have clear boundaries, and relations support bidirectional 1:1 / 1:N / N:1 / N:N plus self-reference. Every save produces an immutable version with field-level diff, one-click restore and a time-machine view."],
      s: ["建 · 内容生产", "Authoring"],
      u: "product.html"
    }
  ];

  /* ================= 检索 ================= */
  function buildIndex() {
    var i0 = idx();
    for (var i = 0; i < CORPUS.length; i++) {
      var c = CORPUS[i];
      if (!c._tokens) c._tokens = [];
      c._tokens[i0] = uniq(tokenize(c.t[i0]).concat(tokenize(c.k.join(" "))).concat(tokenize(c.a[i0])));
    }
  }

  function search(query, topK) {
    buildIndex();
    var i0 = idx();
    var qt = uniq(tokenize(query));
    if (!qt.length) return [];
    var res = [];
    for (var i = 0; i < CORPUS.length; i++) {
      var c = CORPUS[i];
      var toks = c._tokens[i0] || [];
      var set = {}, n = 0;
      for (var j = 0; j < toks.length; j++) set[toks[j]] = 1;
      for (var q = 0; q < qt.length; q++) if (set[qt[q]]) n++;
      var titleToks = uniq(tokenize(c.t[i0]));
      var tset = {}, tn = 0;
      for (var m = 0; m < titleToks.length; m++) tset[titleToks[m]] = 1;
      for (var q2 = 0; q2 < qt.length; q2++) if (tset[qt[q2]]) tn++;
      if (!n) continue;
      var recall = n / qt.length;
      var titleHit = tn / Math.max(1, qt.length);
      res.push({ doc: c, score: Math.min(1, recall * 0.78 + titleHit * 0.42), hits: n });
    }
    res.sort(function (a, b) { return b.score - a.score; });
    return res.slice(0, topK || 3);
  }

  /* 证据不足阈值：低于该分数即拒答，不编造 */
  var CONFIDENCE_GATE = 0.30;

  var T = {
    zh: {
      fabTitle: "AI 助手",
      head: { t: "PowerCMS 12 AI 助手", s: "混合检索 · 引用溯源 · 证据不足即拒答" },
      welcome: "你好，我是本站的 AI 助手。我可以基于本产品站的公开资料回答 PowerCMS 12 的 AI 能力、部署、治理与迁移问题，答案会附出处。",
      placeholder: "例如：AI 能力有哪些？语义检索怎么做？",
      send: "发送",
      hint: "演示版：基于本地语料离线检索，不调用外部大模型，也不会收集你的输入。",
      sources: "引用来源",
      refuse: "未找到可靠依据，按引用门禁要求拒绝作答。",
      refuseTip: "换个说法试试，或直接预约演示由顾问解答。",
      suggest: ["AI 能力有哪些？", "语义检索怎么做？", "数据会出境吗？", "MCP 有多少工具？", "审核是全自动吗？", "迁移会丢旧链接吗？", "价格与 AI 分层？", "性能基线是多少？"],
      notFound: "没有检索到相关内容，请换个问法。"
    },
    en: {
      fabTitle: "AI Assistant",
      head: { t: "PowerCMS 12 AI Assistant", s: "Hybrid retrieval · cited answers · refuses without evidence" },
      welcome: "Hi — I'm the AI assistant for this site. I answer questions about PowerCMS 12's AI capabilities, deployment, governance and migration using public product material, and every answer comes with sources.",
      placeholder: "e.g. What AI capabilities are included?",
      send: "Send",
      hint: "Demo build: offline retrieval over a local corpus. No external model is called and nothing you type is collected.",
      sources: "Sources",
      refuse: "No reliable evidence found — refusing to answer, as the citation gate requires.",
      refuseTip: "Try rephrasing, or book a demo and talk to a solution consultant.",
      suggest: ["What AI capabilities are included?", "How does semantic search work?", "Does data leave our network?", "How many MCP tools?", "Is moderation fully automatic?", "Will migration break old URLs?", "Pricing and AI tiers?", "Performance baselines?"],
      notFound: "Nothing relevant found — try rephrasing."
    }
  };

  /* ================= 悬浮 AI 助手 ================= */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function initAssistant() {
    if (document.querySelector(".ai-fab")) return;
    var t = T[lang()];

    var fab = document.createElement("button");
    fab.className = "ai-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", t.fabTitle);
    fab.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/>' +
      '<path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z"/></svg>' +
      '<i class="fab-dot"></i>';

    var panel = document.createElement("div");
    panel.className = "ai-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t.fabTitle);

    var open = false;
    function toggle(v) {
      open = v === undefined ? !open : v;
      panel.classList.toggle("open", open);
      if (open) setTimeout(function () { var i = panel.querySelector("input"); if (i) i.focus(); }, 60);
    }
    fab.addEventListener("click", function () { toggle(); });

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function render() {
      var tt = T[lang()];
      panel.innerHTML =
        '<div class="ai-panel-head">' +
          '<div class="ah-ico">✦</div>' +
          '<div><b>' + tt.head.t + '</b><span>' + tt.head.s + '</span></div>' +
          '<button class="ah-close" type="button" aria-label="close">&times;</button>' +
        '</div>' +
        '<div class="ai-chat"></div>' +
        '<div class="ai-panel-foot">' +
          '<div class="row"><input type="text" placeholder="' + tt.placeholder + '" /><button class="send" type="button">' + tt.send + '</button></div>' +
          '<p class="ai-hint">' + tt.hint + '</p>' +
        '</div>';

      var chat = panel.querySelector(".ai-chat");
      var input = panel.querySelector("input");
      var sendBtn = panel.querySelector(".send");
      panel.querySelector(".ah-close").addEventListener("click", function () { toggle(false); });

      function bubble(role, html) {
        var d = document.createElement("div");
        d.className = "ai-msg" + (role === "user" ? " user" : "");
        d.innerHTML = '<div class="av">' + (role === "user" ? "你" : "✦") + '</div><div class="bubble">' + html + '</div>';
        chat.appendChild(d);
        chat.scrollTop = chat.scrollHeight;
        return d;
      }

      function answer(q) {
        bubble("user", esc(q));
        var res = search(q, 3);
        var best = res.length ? res[0] : null;
        var tt2 = T[lang()];
        var i0 = idx();
        if (!best || best.score < CONFIDENCE_GATE) {
          bubble("bot",
            '<span class="refuse-tag">' + tt2.refuse + '</span><br>' + tt2.refuseTip);
          return;
        }
        var html = esc(best.doc.a[i0]);
        var srcs = '<div class="srcs"><b>' + tt2.sources + '</b>';
        for (var i = 0; i < res.length; i++) {
          if (res[i].score < CONFIDENCE_GATE) break;
          srcs += '<a href="' + res[i].doc.u + '">[' + (i + 1) + '] ' + esc(res[i].doc.s[i0]) + ' · ' + esc(res[i].doc.t[i0]) + '</a>';
        }
        srcs += '</div>';
        bubble("bot", html + srcs);
      }

      sendBtn.addEventListener("click", function () {
        var v = input.value.trim();
        if (!v) return;
        input.value = "";
        answer(v);
      });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { sendBtn.click(); } });

      bubble("bot", esc(tt.welcome));

      // 推荐问题
      var sug = document.createElement("div");
      sug.className = "demo-suggest";
      sug.style.margin = "0 0 4px";
      tt.suggest.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = s;
        b.addEventListener("click", function () { answer(s); });
        sug.appendChild(b);
      });
      chat.appendChild(sug);
      chat.scrollTop = 0;
    }

    render();
    // 语言切换后重渲染（main.js 的监听先注册，故此处后执行）
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.addEventListener("click", function () { render(); });
    });
  }

  /* ==========================================================================
     ai.html 交互演示
     ========================================================================== */

  /* ---------- 演示 1：关键词检索 vs 混合检索 ---------- */
  var SEARCH_DOCS = [
    { t: ["政务公开栏目改版通知", "Open-government section redesign notice"],
      k: [["政务", "栏目", "改版", "通知"], ["government", "section", "notice"]],
      sem: [["信息公开", "站点调整"], ["disclosure", "site update"]] },
    { t: ["信创环境部署与国产数据库适配指南", "Domestic-platform deployment and database adaptation guide"],
      k: [["信创", "部署", "数据库", "适配"], ["deploy", "database", "adaptation"]],
      sem: [["国产化", "迁移", "环境"], ["migration", "environment"]] },
    { t: ["视频转写与字幕生成操作说明", "Video transcription and subtitle generation"],
      k: [["视频", "转写", "字幕"], ["video", "transcription", "subtitle"]],
      sem: [["媒体", "语音识别", "音频"], ["media", "speech", "audio"]] },
    { t: ["内容审核与四眼审批配置手册", "Content moderation and four-eyes approval handbook"],
      k: [["审核", "审批", "四眼"], ["moderation", "approval"]],
      sem: [["合规", "风控", "发布把关"], ["compliance", "risk", "gatekeeping"]] },
    { t: ["AI 自动起草功能使用说明", "AI auto-drafting user guide"],
      k: [["ai", "起草", "草稿"], ["ai", "drafting", "draft"]],
      sem: [["智能生成", "写作辅助", "大模型"], ["generation", "writing", "llm"]] },
    { t: ["站点包导入与模板转换说明", "Site package import and template conversion"],
      k: [["站点包", "导入", "模板", "转换"], ["import", "template", "conversion"]],
      sem: [["迁移", "平迁", "升级"], ["migration", "upgrade"]] },
    { t: ["访客行为分析与第一方统计口径", "Visitor analytics and first-party statistics"],
      k: [["访客", "统计", "分析"], ["analytics", "visitor", "statistics"]],
      sem: [["数据洞察", "埋点", "报表"], ["insight", "tracking", "report"]] },
    { t: ["智能客服知识库搭建实践", "Building a smart customer-service knowledge base"],
      k: [["知识库", "客服"], ["knowledge base", "service"]],
      sem: [["问答", "检索", "自助服务"], ["qa", "retrieval", "self-service"]] },
    { t: ["HLS 加密播放与防盗链配置", "HLS encrypted playback and hotlink protection"],
      k: [["hls", "加密", "播放", "防盗链"], ["hls", "playback", "hotlink"]],
      sem: [["流媒体", "版权保护", "视频分发"], ["streaming", "copyright", "delivery"]] },
    { t: ["无障碍改造：WCAG 2.1 AA 达标清单", "Accessibility remediation: WCAG 2.1 AA checklist"],
      k: [["无障碍", "wcag"], ["accessibility", "wcag"]],
      sem: [["读屏", "键盘导航", "适老化"], ["screen reader", "keyboard", "elderly"]] }
  ];

  /* 同义扩展：模拟向量检索的语义泛化能力 */
  var SYN = {
    zh: {
    "智能化": ["ai", "智能", "大模型", "自动"],
    "智能": ["ai", "智能化", "自动"],
    "ai": ["智能", "智能化", "大模型", "自动"],
    "语音转文字": ["转写", "字幕", "视频", "语音识别"],
    "语音识别": ["转写", "字幕", "视频"],
    "怎么把视频变成文字": ["转写", "字幕", "视频", "语音识别"],
    "国产化": ["信创", "数据库", "适配", "迁移"],
    "合规风险": ["审核", "审批", "合规", "风控"],
    "风控": ["审核", "审批", "合规"],
    "上线把关": ["审核", "审批", "发布把关"],
    "帮写": ["起草", "ai", "写作辅助"],
    "写作": ["起草", "ai", "写作辅助"],
    "自动写稿": ["起草", "ai", "智能生成"],
    "站点搬家": ["站点包", "模板", "转换", "迁移", "平迁"],
    "系统升级": ["站点包", "模板", "转换", "迁移", "平迁", "升级"],
    "看数据": ["统计", "分析", "访客", "报表"],
    "报表": ["统计", "分析", "访客"],
    "问答机器人": ["知识库", "问答", "检索"],
    "自助服务": ["知识库", "问答", "检索"],
    "视频版权": ["hls", "加密", "防盗链", "流媒体", "版权保护"],
    "流媒体": ["hls", "播放", "视频", "加密"],
    "适老化": ["无障碍", "wcag", "读屏", "键盘导航"],
    "读屏": ["无障碍", "wcag"],
    "信息公开": ["政务", "栏目", "公开"]
    },
    en: {
      "how do i turn speech in a video into text": ["transcription", "subtitle", "video", "speech"],
      "speech to text": ["transcription", "subtitle", "video", "speech"],
      "domestic platform": ["deploy", "database", "adaptation", "migration"],
      "compliance risk": ["moderation", "approval", "compliance", "risk"],
      "control": ["moderation", "approval", "gatekeeping"],
      "write for me": ["drafting", "ai", "writing"],
      "writing": ["drafting", "ai", "writing"],
      "auto generate": ["drafting", "ai", "generation"],
      "moving the site": ["import", "template", "conversion", "migration", "upgrade"],
      "replatform": ["import", "template", "conversion", "migration", "upgrade"],
      "see the numbers": ["analytics", "visitor", "statistics", "report"],
      "report": ["analytics", "visitor", "statistics"],
      "chatbot": ["knowledge base", "qa", "retrieval"],
      "self-service": ["knowledge base", "qa", "retrieval"],
      "video copyright": ["hls", "hotlink", "streaming", "copyright"],
      "streaming": ["hls", "playback", "video", "copyright"],
      "elderly": ["accessibility", "wcag", "screen reader"],
      "screen reader": ["accessibility", "wcag"],
      "open data": ["government", "section", "disclosure"]
    }
  };

  function expandSemantic(q) {
    var map = SYN[lang()] || SYN.zh;
    var out = [q];
    for (var key in map) {
      if (q.toLowerCase().indexOf(key) !== -1) out = out.concat(map[key]);
    }
    return uniq(tokenize(out.join(" ")));
  }

  function scoreDocs(qTokens, useSemantic) {
    var i0 = idx();
    var res = [];
    for (var i = 0; i < SEARCH_DOCS.length; i++) {
      var d = SEARCH_DOCS[i];
      var hay = uniq(tokenize(d.t[i0])
        .concat(tokenize(d.k[i0].join(" ")))
        .concat(useSemantic ? tokenize(d.sem[i0].join(" ")) : []));
      var set = {}, n = 0;
      for (var j = 0; j < hay.length; j++) set[hay[j]] = 1;
      var tset = {}, tn = 0;
      var ttok = uniq(tokenize(d.t[i0]));
      for (var m = 0; m < ttok.length; m++) tset[ttok[m]] = 1;
      for (var q = 0; q < qTokens.length; q++) {
        if (set[qTokens[q]]) n++;
        if (tset[qTokens[q]]) tn++;
      }
      if (!n) continue;
      var sc = Math.min(0.99, (n / qTokens.length) * 0.72 + (tn / Math.max(1, qTokens.length)) * 0.34);
      res.push({ d: d, score: sc });
    }
    res.sort(function (a, b) { return b.score - a.score; });
    return res.slice(0, 4);
  }

  function initSearchDemo() {
    var root = document.getElementById("demo-search");
    if (!root) return;
    var i18n = window.AI_DEMO_I18N || {};
    function tx(k, fb) { var v = i18n[k]; return v ? v[idx()] : fb; }

    root.innerHTML =
      '<div class="demo-input"><input type="text" value="' + tx("ds.q", "怎么把视频里的语音转成文字") + '" /><button class="btn btn-primary" type="button">' + tx("ds.run", "检索") + '</button></div>' +
      '<div class="demo-suggest"></div>' +
      '<div class="cmp-grid">' +
        '<div class="cmp-col"><h5>' + tx("ds.kw", "关键词检索 BM25") + '<em>' + tx("ds.kwn", "仅字面匹配") + '</em></h5><div class="res-list" data-kw></div></div>' +
        '<div class="cmp-col sem"><h5>' + tx("ds.hy", "混合检索 BM25 0.4 + k-NN 0.6") + '<em>' + tx("ds.hyn", "语义泛化") + '</em></h5><div class="res-list" data-hy></div></div>' +
      '</div>';

    var input = root.querySelector("input");
    var sug = root.querySelector(".demo-suggest");
    var kwBox = root.querySelector("[data-kw]");
    var hyBox = root.querySelector("[data-hy]");

    var presets = [
      ["怎么把视频里的语音转成文字", "How do I turn speech in a video into text?"],
      ["国产化环境怎么部署", "How do we deploy on a domestic platform?"],
      ["发布前怎么把控合规风险", "How do we control compliance risk before publishing?"],
      ["站点搬家会不会很麻烦", "Is moving the site a hassle?"]
    ];
    presets.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p[idx()];
      b.addEventListener("click", function () { input.value = p[idx()]; run(); });
      sug.appendChild(b);
    });

    function renderBox(box, res, emptyText) {
      if (!res.length) { box.innerHTML = '<div class="res-empty">' + emptyText + '</div>'; return; }
      var h = "";
      for (var i = 0; i < res.length; i++) {
        h += '<div class="res-item hit"><span class="score">' + res[i].score.toFixed(2) + '</span><span><span class="rt">' +
          esc(res[i].d.t[idx()]) + '</span><span class="rd">' + esc(res[i].d.k[idx()].slice(0, 5).join(" · ")) + '</span></span></div>';
      }
      box.innerHTML = h;
    }

    function run() {
      var q = input.value.trim();
      var kw = scoreDocs(uniq(tokenize(q)), false);
      var hy = scoreDocs(expandSemantic(q), true);
      renderBox(kwBox, kw, tx("ds.empty", "无匹配结果"));
      renderBox(hyBox, hy, tx("ds.empty", "无匹配结果"));
    }

    root.querySelector(".btn").addEventListener("click", run);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    run();
  }

  /* ---------- 演示 2：溯源问答 ---------- */
  var ASK_CASES = [
    {
      q: ["PowerCMS 12 的 AI 会用到我们内网之外的数据吗？", "Does PowerCMS 12's AI use data outside our intranet?"],
      a: ["不会。AI 能力由统一 OpenAI 兼容适配层承载，可配置为完全私有化部署：模型调用走内网或客户自有密钥（BYOK，站点级隔离），视频转写默认使用本地 Whisper。开启后所有调用计入配额与审计。",
        "No. AI runs through a unified OpenAI-compatible adapter that can be deployed fully on-premises: model calls travel the intranet or use the customer's own keys (BYOK, isolated per site), and video transcription uses local Whisper by default. Once enabled, every call is metered and audited."],
      c: ["ai-private", "ai-model", "ai-switch"]
    },
    {
      q: ["AI 生成的内容能直接发布上线吗？", "Can AI-generated content be published directly?"],
      a: ["不能直接发布。AI 输出需先通过内容类型 schema 校验（长度 / 类型 / 必填 / 枚举），再走四眼审批与会签；AI 建议态内容在人工确认前不进入版本历史，确认动作本身留审计。发布与否始终由人决定。",
        "Not directly. Model output must first pass content-type schema validation (length / type / required / enum), then four-eyes approval and co-signing. AI-suggested content does not enter version history until a human confirms it, and that confirmation is itself audited. Publishing always remains a human decision."],
      c: ["ai-schema", "ai-moderation", "ai-audit"]
    },
    {
      q: ["站内问答如果找不到依据会怎么做？", "What happens if grounded Q&A finds no evidence?"],
      a: ["明确拒答。引用门禁默认失败关闭：引用必须命中本次 top-k 检索上下文并携带条目、版本与发布时间；证据不足时系统拒绝作答，不编造，并提示换一种问法或转人工。",
        "It explicitly refuses. The citation gate fails closed: every citation must hit the current top-k context and carry entry, version and publish time. With insufficient evidence the system declines to answer rather than fabricating, and suggests rephrasing or escalating to a human."],
      c: ["ai-ask", "ai-audit"]
    },
    {
      q: ["PowerCMS 12 支持量子加密通信吗？", "Does PowerCMS 12 support quantum-encrypted communication?"],
      a: ["", ""],
      c: [],
      refuse: true
    }
  ];

  function initAskDemo() {
    var root = document.getElementById("demo-ask");
    if (!root) return;
    var i18n = window.AI_DEMO_I18N || {};
    function tx(k, fb) { var v = i18n[k]; return v ? v[idx()] : fb; }

    root.innerHTML =
      '<div class="demo-suggest"></div>' +
      '<div class="ask-answer"><span class="ai-mark">✦ ' + tx("da.gen", "AI 生成 · 已通过引用门禁") + '</span><div data-ans></div></div>' +
      '<div class="cite-list" data-cites></div>';

    var sug = root.querySelector(".demo-suggest");
    var ansBox = root.querySelector("[data-ans]");
    var citeBox = root.querySelector("[data-cites]");
    var answerEl = root.querySelector(".ask-answer");

    ASK_CASES.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = c.q[idx()];
      b.addEventListener("click", function () { run(c); });
      sug.appendChild(b);
    });

    function run(c) {
      if (c.refuse) {
        answerEl.classList.add("ask-refuse");
        root.querySelector(".ai-mark").textContent = "✦ " + tx("da.refuseTag", "AI 拒答 · 引用门禁触发");
        ansBox.innerHTML = '<p>' + tx("da.refuse", "未在已发布内容中检索到可靠依据。按引用门禁要求，此处拒绝作答，不生成推测性内容。") + '</p>';
        citeBox.innerHTML = '<div class="cite"><span class="cno">!</span><span><b>' +
          tx("da.refuseT", "证据不足（top-k 相似度低于阈值）") + '</b><span>' +
          tx("da.refuseD", "索引外内容零引用 · 建议调整问法或转人工") + '</span></span></div>';
        return;
      }
      answerEl.classList.remove("ask-refuse");
      root.querySelector(".ai-mark").textContent = "✦ " + tx("da.gen", "AI 生成 · 已通过引用门禁");
      ansBox.innerHTML = '<p>' + esc(c.a[idx()]) + '</p>';
      var h = "";
      for (var i = 0; i < c.c.length; i++) {
        var doc = null;
        for (var j = 0; j < CORPUS.length; j++) if (CORPUS[j].id === c.c[i]) doc = CORPUS[j];
        if (!doc) continue;
        h += '<div class="cite"><span class="cno">' + (i + 1) + '</span>' +
          '<span><b>' + esc(doc.t[idx()]) + '</b><span>' + esc(doc.s[idx()]) + ' · v12.0 · ' +
          tx("da.pub", "已发布") + '</span></span>' +
          '<span class="cscore">' + (0.94 - i * 0.07).toFixed(2) + '</span></div>';
      }
      citeBox.innerHTML = h;
    }

    run(ASK_CASES[0]);
  }

  /* ---------- 演示 3：AI 辅助编辑 ---------- */
  var ED_CASES = {
    title: {
      base: ["2026 年政务公开工作要点发布", "2026 Open-Government Work Priorities Published"],
      outs: {
        continue: ["2026 年政务公开工作要点发布：三大重点任务与考核口径同步明确", "2026 Open-Government Work Priorities Published: Three Key Tasks and Assessment Criteria Clarified"],
        rewrite: ["2026 年政务公开工作要点出台，明确重点领域与考核标准", "2026 Open-Government Priorities Issued, Defining Key Areas and Assessment Standards"],
        shorten: ["2026 年政务公开工作要点发布", "2026 Open-Government Priorities Published"],
        expand: ["2026 年政务公开工作要点发布：聚焦重点领域、政策解读与基层直达三大任务", "2026 Open-Government Priorities Published: Focusing on Key Areas, Policy Interpretation and Grassroots Delivery"]
      }
    },
    excerpt: {
      base: ["本文介绍了本年度政务公开的重点任务。", "This article introduces this year's open-government priorities."],
      outs: {
        continue: ["本文介绍了本年度政务公开的重点任务，并说明考核口径、责任分工与完成时限，便于各单位对照落实。", "This article introduces this year's open-government priorities, and explains assessment criteria, responsibilities and deadlines so each unit can act accordingly."],
        rewrite: ["围绕重点领域公开、政策解读与基层直达，本文梳理本年度政务公开的三项核心任务。", "Centred on key-area disclosure, policy interpretation and grassroots delivery, this article outlines three core tasks for the year."],
        shorten: ["本年度政务公开重点任务解读。", "An overview of this year's open-government priorities."],
        expand: ["本文介绍了本年度政务公开的重点任务，覆盖重点领域信息公开、重大政策同步解读、基层直达渠道建设三个方面，并明确考核口径、责任分工与完成时限。", "This article introduces this year's open-government priorities across three areas — key-area disclosure, synchronized interpretation of major policies, and grassroots delivery channels — and clarifies assessment criteria, responsibilities and deadlines."]
      }
    },
    body: {
      base: ["各单位要按职责分工推进落实。", "Each unit shall advance implementation per its assigned responsibilities."],
      outs: {
        continue: ["各单位要按职责分工推进落实，按月报送进展，季度开展一次自查，年底统一考核。", "Each unit shall advance implementation per its assigned responsibilities, report progress monthly, conduct quarterly self-inspection, and undergo unified year-end assessment."],
        rewrite: ["各责任单位须依据职责分工推进任务落地。", "Responsible units must drive task delivery according to their assigned duties."],
        shorten: ["按职责分工推进落实。", "Implement per assigned responsibilities."],
        expand: ["各单位要按职责分工推进落实：牵头单位负责统筹协调与进度把控，配合单位按时间节点提供材料，落实情况纳入年度绩效考核。", "Each unit shall advance implementation per its assigned responsibilities: lead units coordinate and control progress, supporting units supply materials against the schedule, and delivery is folded into annual performance assessment."]
      }
    }
  };

  var ED_OPS = [
    { k: "continue", zh: "续写", en: "Continue" },
    { k: "rewrite", zh: "改写", en: "Rewrite" },
    { k: "shorten", zh: "缩写", en: "Condense" },
    { k: "expand", zh: "扩写", en: "Expand" },
    { k: "summarize", zh: "摘要", en: "Summarize" },
    { k: "proofread", zh: "纠错", en: "Proofread" },
    { k: "translate", zh: "翻译 EN", en: "Translate 中文" }
  ];

  function initEditorDemo() {
    var root = document.getElementById("demo-editor");
    if (!root) return;
    var i18n = window.AI_DEMO_I18N || {};
    function tx(k, fb) { var v = i18n[k]; return v ? v[idx()] : fb; }

    root.innerHTML =
      '<div class="ed-grid">' +
        '<div>' +
          '<div class="v-title" style="margin-bottom:12px;">' + tx("de.fields", "内容字段") + '</div>' +
          '<div class="ed-field active" data-f="title"><div class="ed-label"><b>' + tx("de.f1", "标题 TITLE") + '</b><i>string · max 80</i></div><div class="ed-val" data-v="title"></div></div>' +
          '<div class="ed-field" data-f="excerpt"><div class="ed-label"><b>' + tx("de.f2", "摘要 EXCERPT") + '</b><i>string · max 200</i></div><div class="ed-val" data-v="excerpt"></div></div>' +
          '<div class="ed-field" data-f="body"><div class="ed-label"><b>' + tx("de.f3", "正文 BODY") + '</b><i>richtext · required</i></div><div class="ed-val" data-v="body"></div></div>' +
        '</div>' +
        '<div>' +
          '<div class="v-title" style="margin-bottom:12px;">' + tx("de.ops", "字段级 AI 操作") + '</div>' +
          '<div class="ed-ops"></div>' +
          '<div class="ed-check" data-check></div>' +
        '</div>' +
      '</div>';

    var opsBox = root.querySelector(".ed-ops");
    var checkBox = root.querySelector("[data-check]");
    var current = "title";

    function valBox(f) { return root.querySelector('[data-v="' + f + '"]'); }

    Object.keys(ED_CASES).forEach(function (f) { valBox(f).textContent = ED_CASES[f].base[idx()]; });

    root.querySelectorAll(".ed-field").forEach(function (el) {
      el.addEventListener("click", function () {
        root.querySelectorAll(".ed-field").forEach(function (x) { x.classList.remove("active"); });
        el.classList.add("active");
        current = el.getAttribute("data-f");
        renderCheck(null);
      });
    });

    ED_OPS.forEach(function (op) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = op[idx() === 1 ? "en" : "zh"];
      b.addEventListener("click", function () { run(op.k, b); });
      opsBox.appendChild(b);
    });

    function outFor(op) {
      var c = ED_CASES[current];
      if (op === "summarize") {
        return [c.base[0].slice(0, 22) + "…（要点：任务分工、进度报送、考核闭环）",
          c.base[1].slice(0, 40) + "… (key points: responsibilities, progress reporting, closed-loop assessment)"][idx()];
      }
      if (op === "proofread") {
        return [c.base[0] + "（校对完成：未发现错别字与标点问题）",
          c.base[1] + " (proofread: no typos or punctuation issues found)"][idx()];
      }
      if (op === "translate") {
        return [c.base[1], c.base[0]][idx()];
      }
      return c.outs[op][idx()];
    }

    function renderCheck(op) {
      if (!op) {
        checkBox.innerHTML = '<code>' + tx("de.idle", "选择字段并点击操作，AI 结果以「插入 / 替换」回填，可二次编辑") + '</code>';
        return;
      }
      var out = outFor(op);
      var lenOk = out.length <= 200;
      checkBox.innerHTML =
        tx("de.check", "schema 校验") + '：' +
        '<code>type=string</code> <code>required=ok</code> <code>len=' + out.length + '</code> ' +
        '<span class="ok">✓ ' + tx("de.pass", "通过后才可落库") + '</span>' +
        (lenOk ? '' : ' <code>max exceeded</code>');
    }

    function run(op, btn) {
      btn.classList.add("running");
      var box = valBox(current);
      box.classList.add("type");
      var text = outFor(op);
      var i = 0;
      box.textContent = "";
      var timer = setInterval(function () {
        i += Math.max(2, Math.ceil(text.length / 18));
        box.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(timer);
          box.classList.remove("type");
          box.innerHTML = '<span class="ins">' + esc(text) + '</span>';
          btn.classList.remove("running");
          renderCheck(op);
        }
      }, 45);
    }

    renderCheck(null);
  }

  /* ---------- 演示 4：自动化审核流水线 ---------- */
  var PIPE_STEPS = [
    { i: "①", t: ["内容提交", "Submit"], d: ["作者提交草稿", "Author submits draft"], ok: ["草稿 D-1042 已提交（来源：AI 起草 60% + 人工 40%）", "Draft D-1042 submitted (60% AI-drafted, 40% human)"], lv: "" },
    { i: "②", t: ["AI 合规预检", "AI pre-check"], d: ["敏感词 / 事实性 / 重复度", "Sensitive term / factuality / duplication"], ok: ["敏感词通过 · SimHash 重复度 0.12 · 事实性需人工确认 1 处", "Sensitive terms passed · SimHash duplication 0.12 · 1 factuality item needs human review"], lv: "warn" },
    { i: "③", t: ["AI 风险摘要", "AI risk summary"], d: ["生成审批辅助摘要", "Generate reviewer summary"], ok: ["风险等级：中（涉政策表述 1 处）· 已生成 3 条修改建议", "Risk level: Medium (1 policy wording issue) · 3 revision suggestions generated"], lv: "warn" },
    { i: "④", t: ["人工四眼审批", "Four-eyes approval"], d: ["双人复核 / 会签", "Two-person review / co-sign"], ok: ["审批人 A 已通过 → 审批人 B 已通过（会签完成）", "Reviewer A approved → Reviewer B approved (co-signing complete)"], lv: "" },
    { i: "⑤", t: ["发布并入审计", "Publish & audit"], d: ["确定性发布 · 全动作留痕", "Deterministic release · full audit"], ok: ["Release R-208 已发布 · AI 参与标识已写入 · 审计 7 条", "Release R-208 published · AI participation labelled · 7 audit entries"], lv: "" }
  ];

  function initPipeDemo() {
    var root = document.getElementById("demo-pipe");
    if (!root) return;
    var i18n = window.AI_DEMO_I18N || {};
    function tx(k, fb) { var v = i18n[k]; return v ? v[idx()] : fb; }

    root.innerHTML =
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:22px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary" type="button" data-run>' + tx("dp.run", "运行一次审核") + '</button>' +
        '<button class="btn btn-ghost" type="button" data-reset>' + tx("dp.reset", "重置") + '</button>' +
        '<span style="font-size:12.5px;color:var(--muted);">' + tx("dp.note", "全流程平均 4 分 12 秒；AI 承担预检与摘要，发布决定权始终在人工") + '</span>' +
      '</div>' +
      '<div class="pipe"></div>' +
      '<div class="pipe-log" data-log></div>';

    var pipeBox = root.querySelector(".pipe");
    var logBox = root.querySelector("[data-log]");
    var runBtn = root.querySelector("[data-run]");
    var resetBtn = root.querySelector("[data-reset]");
    var timer = null;

    function now() {
      var d = new Date();
      return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
    }

    function render(state) {
      var h = "";
      for (var i = 0; i < PIPE_STEPS.length; i++) {
        var cls = "";
        if (state > i) cls = "done";
        else if (state === i) cls = "run";
        h += '<div class="pipe-step ' + cls + '"><div class="pipe-dot">' +
          (state > i ? "✓" : PIPE_STEPS[i].i) + '</div><b>' + esc(PIPE_STEPS[i].t[idx()]) + '</b><span>' + esc(PIPE_STEPS[i].d[idx()]) + '</span></div>';
      }
      pipeBox.innerHTML = h;
    }

    function log(text, lv) {
      var d = document.createElement("div");
      d.innerHTML = '<span class="l-time">[' + now() + ']</span> <span class="l-' + (lv || "ok") + '">' + esc(text) + '</span>';
      logBox.appendChild(d);
      logBox.scrollTop = logBox.scrollHeight;
    }

    function reset() {
      if (timer) { clearTimeout(timer); timer = null; }
      render(-1);
      logBox.innerHTML = "";
      log(tx("dp.wait", "等待提交…"), "");
      runBtn.disabled = false;
    }

    function step(i) {
      render(i);
      var s = PIPE_STEPS[i];
      log(s.ok[idx()], s.lv);
      if (i < PIPE_STEPS.length - 1) {
        timer = setTimeout(function () { step(i + 1); }, 900);
      } else {
        render(PIPE_STEPS.length);   // 收尾：全部标记为已完成
        log(tx("dp.done", "流水线完成 · 4 分 12 秒 · 人工介入 1 次"), "");
        runBtn.disabled = false;
      }
    }

    runBtn.addEventListener("click", function () {
      runBtn.disabled = true;
      reset();
      logBox.innerHTML = "";
      step(0);
    });
    resetBtn.addEventListener("click", reset);

    reset();
  }

  /* ---------- 演示 5：智能推荐 ---------- */
  var REC_PROFILES = [
    {
      name: ["信息化负责人", "IT decision-maker"],
      items: [
        { t: ["私有化部署与信创适配白皮书", "On-premises & domestic-platform whitepaper"], r: ["关注部署形态与数据主权", "Cares about deployment model and data sovereignty"], s: 0.94, tag: ["白皮书", "Whitepaper"] },
        { t: ["存量 CMS 平迁对账清单模板", "Legacy CMS migration reconciliation template"], r: ["近期有系统替换诉求", "Actively planning a system replacement"], s: 0.88, tag: ["工具", "Toolkit"] },
        { t: ["可写入招标文件的验收指标", "Acceptance criteria for tender documents"], r: ["选型阶段，需要硬指标", "In vendor selection, needs hard criteria"], s: 0.81, tag: ["指南", "Guide"] }
      ]
    },
    {
      name: ["内容运营编辑", "Content editor"],
      items: [
        { t: ["AI 自动起草与批量发布上手指南", "AI drafting & batch publishing quickstart"], r: ["日常高产，追求效率", "High-volume publishing, values speed"], s: 0.92, tag: ["上手", "Quickstart"] },
        { t: ["可视化编辑器拖拽排版技巧", "Visual editor drag-and-drop tips"], r: ["免开发改页面诉求强", "Wants to edit pages without developers"], s: 0.85, tag: ["技巧", "Tips"] },
        { t: ["定时发布与一键回滚操作手册", "Scheduled publishing & rollback handbook"], r: ["关注发布可控与容错", "Cares about control and recoverability"], s: 0.78, tag: ["手册", "Handbook"] }
      ]
    },
    {
      name: ["前端 / 开发工程师", "Front-end / developer"],
      items: [
        { t: ["MCP 工具面与 71 个工具速查", "MCP tool surface: 71 tools at a glance"], r: ["关注可编程集成能力", "Cares about programmatic integration"], s: 0.95, tag: ["API", "API"] },
        { t: ["GraphQL Schema 动态生成说明", "Dynamic GraphQL schema generation"], r: ["按模型版本消费 API", "Consumes API by model version"], s: 0.87, tag: ["API", "API"] },
        { t: ["FreeMarker 模板与在线 IDE 实践", "FreeMarker templates & online IDE"], r: ["需要代码通道与调试效率", "Needs code access and debugging speed"], s: 0.8, tag: ["开发", "Dev"] }
      ]
    }
  ];

  function initRecDemo() {
    var root = document.getElementById("demo-rec");
    if (!root) return;
    var i18n = window.AI_DEMO_I18N || {};
    function tx(k, fb) { var v = i18n[k]; return v ? v[idx()] : fb; }

    root.innerHTML =
      '<div class="demo-suggest" data-prof></div>' +
      '<div class="rec-grid" data-recs></div>' +
      '<p style="margin-top:16px;font-size:12.5px;color:var(--muted);">' +
        tx("dr.note", "推荐依据：第一方行为（零第三方 Cookie）+ 内容语义相似度 + 业务规则；编辑可在可视化编辑器中干预排序与兜底策略。") +
      '</p>';

    var pBox = root.querySelector("[data-prof]");
    var rBox = root.querySelector("[data-recs]");

    REC_PROFILES.forEach(function (p, pi) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p.name[idx()];
      if (pi === 0) b.style.borderStyle = "solid";
      b.addEventListener("click", function () {
        pBox.querySelectorAll("button").forEach(function (x) { x.style.borderStyle = ""; });
        b.style.borderStyle = "solid";
        render(p);
      });
      pBox.appendChild(b);
    });

    function render(p) {
      var h = "";
      for (var i = 0; i < p.items.length; i++) {
        var it = p.items[i];
        h += '<div class="rec-card"><span class="rtag">' + esc(it.tag[idx()]) + '</span>' +
          '<b>' + esc(it.t[idx()]) + '</b>' +
          '<span>' + tx("dr.reason", "推荐理由") + '：' + esc(it.r[idx()]) + '</span>' +
          '<div class="rec-bar"><i style="width:' + Math.round(it.s * 100) + '%"></i></div>' +
          '<span>' + tx("dr.match", "匹配度") + ' ' + it.s.toFixed(2) + '</span></div>';
      }
      rBox.innerHTML = h;
    }

    render(REC_PROFILES[0]);
  }

  /* ================= 启动 ================= */
  function bootDemos() {
    initSearchDemo();
    initAskDemo();
    initEditorDemo();
    initPipeDemo();
    initRecDemo();
  }

  function boot() {
    initAssistant();
    if (document.getElementById("demo-search")) bootDemos();
    // 语言切换后重渲染演示
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.addEventListener("click", function () { bootDemos(); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.__aiReload = bootDemos;
})();
