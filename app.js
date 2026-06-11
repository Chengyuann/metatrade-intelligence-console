const demoFields = {
  shipper: "Shenzhen Huadong Electronics Co., Ltd.",
  consignee: "Klang Distribution Sdn. Bhd.",
  blNumber: "MAEU-93827104",
  goods: "Bluetooth Headphones with Lithium Batteries",
  grossWeight: "4,820 KG",
  amount: "CNY 2,800,000",
  originPort: "Shenzhen, China",
  destinationPort: "Port Klang, Malaysia",
};

const LOCAL_API_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const PLAY_ICON = '<span aria-hidden="true"><svg><use href="#icon-play"></use></svg></span>';
const ASSET_ICON = '<svg aria-hidden="true"><use href="#icon-asset"></use></svg>';

const productModules = {
  perception: {
    kicker: "单据感知层",
    title: "单据感知会把字段变成可复核证据。",
    copy: "多模态识别服务负责读取 PDF 或图片单据，视觉复核负责检查遮挡、水印、折痕和低置信字段。运营用户先看到结论，再决定是否打开字段证据。",
    metric: "98.2%",
    metricLabel: "字段可信度",
    bullets: ["提单号、货值、港口和货物描述统一结构化", "低置信字段进入视觉复核队列", "保留证据链，方便银行风控复盘"],
    target: "documentPanel",
    section: "documentSection",
  },
  risk: {
    kicker: "风险证据层",
    title: "风控结论必须带理由，不只给一个红黄绿标签。",
    copy: "合规校验会把货物描述、航线、制裁名单、危规文件和港口事件拆成可追溯提示，帮助审单员判断是否放行、补件或调低授信。",
    metric: "48/100",
    metricLabel: "动态风险",
    bullets: ["识别锂电池、MSDS、UN38.3 等隐含要求", "把航运和港口拥堵事件合并进风险评分", "风险原因以审计语言输出"],
    target: "riskPanel",
    section: "riskSection",
  },
  asset: {
    kicker: "资产治理层",
    title: "资产确权要跟风控同步，而不是在审完单后另起流程。",
    copy: "系统根据风险评分和单据可信度生成建议 LTV、评级、可融资额与 RWA 凭证状态，让贸易资产从单据流转到资金流。",
    metric: "CNY 1.96M",
    metricLabel: "融资空间",
    bullets: ["LTV 随风险评分动态调整", "RWA 凭证记录资产状态和审计日志", "下载 JSON 与合规报告用于后续对接"],
    target: "financePanel",
    section: "financeSection",
  },
  oracle: {
    kicker: "事件监听层",
    title: "在途事件改变资产状态，页面必须把变化讲清楚。",
    copy: "台风、延误、港口拥堵等新闻事件会触发事件监听模拟，更新融资解锁比例、转让锁和资产状态。",
    metric: "60%",
    metricLabel: "事件后解锁",
    bullets: ["输入新闻事件即可模拟链上指令", "高风险事件自动打开转让锁", "时间线保留每次状态变更"],
    target: "eventPanel",
    section: "eventSection",
  },
};

const state = {
  file: null,
  fields: { ...demoFields },
  confidence: 0,
  riskScore: 0,
  ltv: 0,
  rating: "--",
  timeline: [],
  extractedJson: null,
  complianceReport: null,
  credentialId: null,
};

const els = {
  input: document.querySelector("#documentInput"),
  dropZone: document.querySelector("#dropZone"),
  fileHint: document.querySelector("#fileHint"),
  preview: document.querySelector("#documentPreview"),
  runBtn: document.querySelector("#runBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  modeBadge: document.querySelector("#modeBadge"),
  docStatus: document.querySelector("#docStatus"),
  fieldsGrid: document.querySelector("#fieldsGrid"),
  confidenceBadge: document.querySelector("#confidenceBadge"),
  riskLevel: document.querySelector("#riskLevel"),
  riskScore: document.querySelector("#riskScore"),
  meterValue: document.querySelector("#meterValue"),
  riskList: document.querySelector("#riskList"),
  ltvValue: document.querySelector("#ltvValue"),
  loanValue: document.querySelector("#loanValue"),
  ratingValue: document.querySelector("#ratingValue"),
  assetState: document.querySelector("#assetState"),
  mintBtn: document.querySelector("#mintBtn"),
  tokenIdValue: document.querySelector("#tokenIdValue"),
  assetStatusValue: document.querySelector("#assetStatusValue"),
  financingUnlockedValue: document.querySelector("#financingUnlockedValue"),
  transferLockValue: document.querySelector("#transferLockValue"),
  routeEta: document.querySelector("#routeEta"),
  routeRisk: document.querySelector("#routeRisk"),
  routeAsset: document.querySelector("#routeAsset"),
  routeSignal: document.querySelector("#routeSignal"),
  newsInput: document.querySelector("#newsInput"),
  simulateNewsBtn: document.querySelector("#simulateNewsBtn"),
  oracleOutput: document.querySelector("#oracleOutput"),
  mintAnimation: document.querySelector("#mintAnimation"),
  timeline: document.querySelector("#timeline"),
  latencyValue: document.querySelector("#latencyValue"),
  decisionState: document.querySelector("#decisionState"),
  decisionTitle: document.querySelector("#decisionTitle"),
  decisionCopy: document.querySelector("#decisionCopy"),
  decisionAction: document.querySelector("#decisionAction"),
  decisionMode: document.querySelector("#decisionMode"),
  decisionConfidence: document.querySelector("#decisionConfidence"),
  decisionRisk: document.querySelector("#decisionRisk"),
  decisionExposure: document.querySelector("#decisionExposure"),
  evidenceBadge: document.querySelector("#evidenceBadge"),
  evidenceGrid: document.querySelector("#evidenceGrid"),
  downloadJsonBtn: document.querySelector("#downloadJsonBtn"),
  downloadReportBtn: document.querySelector("#downloadReportBtn"),
  credentialNote: document.querySelector("#credentialNote"),
  credentialWorkbench: document.querySelector("#credentialWorkbench"),
  credentialVisual: document.querySelector("#credentialVisual"),
  credentialVisualStatus: document.querySelector("#credentialVisualStatus"),
  credentialVisualHash: document.querySelector("#credentialVisualHash"),
  credentialBrief: document.querySelector("#credentialBrief"),
  viewButtons: document.querySelectorAll(".ghost-btn[data-focus-target]"),
  moduleCards: document.querySelectorAll(".module-card"),
  workSections: document.querySelectorAll(".work-section"),
  moduleKicker: document.querySelector("#moduleKicker"),
  moduleTitle: document.querySelector("#moduleTitle"),
  moduleCopy: document.querySelector("#moduleCopy"),
  moduleBullets: document.querySelector("#moduleBullets"),
  moduleMetric: document.querySelector("#moduleMetric"),
  moduleMetricLabel: document.querySelector("#moduleMetricLabel"),
  moduleJumpBtn: document.querySelector("#moduleJumpBtn"),
};

function setupRevealEffects() {
  const items = Array.from(document.querySelectorAll(".panel, .step-card, .hero-band, .ops-strip, .story-overview, .module-detail-band, .work-section, .finance-brief"));
  items.forEach((item, index) => {
    item.classList.add("reveal-item", "spotlight-card");
    item.style.setProperty("--reveal-index", String(index % 8));
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
  } else {
    items.forEach((item) => item.classList.add("is-visible"));
  }

  items.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      item.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    });
  });
}

function focusWorkbenchPanel(targetId) {
  const target = document.querySelector(`#${targetId}`);
  if (!target) return;
  const section = target.closest(".work-section");
  if (section) openWorkSection(section.id);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.focus({ preventScroll: true });
  target.classList.remove("focus-pulse");
  requestAnimationFrame(() => target.classList.add("focus-pulse"));
}

function openWorkSection(sectionId, { scroll = false } = {}) {
  const targetSection = document.querySelector(`#${sectionId}`);
  if (!targetSection) return;
  els.workSections.forEach((section) => {
    section.open = section === targetSection;
    section.classList.toggle("is-active", section === targetSection);
  });
  if (scroll) targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function collapseWorkSections() {
  els.workSections.forEach((section) => {
    section.open = false;
    section.classList.remove("is-active");
  });
}

function renderProductModule(moduleKey = "perception") {
  const module = productModules[moduleKey] || productModules.perception;
  els.moduleCards.forEach((card) => {
    const active = card.dataset.module === moduleKey;
    card.classList.toggle("active", active);
    card.setAttribute("aria-pressed", String(active));
  });
  els.moduleKicker.textContent = module.kicker;
  els.moduleTitle.textContent = module.title;
  els.moduleCopy.textContent = module.copy;
  els.moduleMetric.textContent = module.metric;
  els.moduleMetricLabel.textContent = module.metricLabel;
  els.moduleBullets.innerHTML = module.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  els.moduleJumpBtn.dataset.target = module.target;
  els.moduleJumpBtn.dataset.section = module.section;
  openWorkSection(module.section);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowStamp() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pushTimeline(stage, detail, tag = "OK") {
  state.timeline.unshift({ time: nowStamp(), stage, detail, tag });
  renderTimeline();
}

function renderTimeline() {
  els.timeline.innerHTML = state.timeline
    .map(
      (item) => `
        <li>
          <time>${escapeHtml(item.time)}</time>
          <span>${escapeHtml(item.stage)} / ${escapeHtml(item.detail)}</span>
          <span class="tag">${escapeHtml(item.tag)}</span>
        </li>
      `,
    )
    .join("");
}

function updateDecision({
  stateLabel = "等待识别",
  title = "等待贸易单据审单",
  copy = "上传单据或使用样例资产后，系统将联动多模态单据识别、视觉复核、合规校验与动态资产治理。",
  action = "下一步：运行审单链路",
  mode = "演示 / 接口就绪",
  confidence = "--",
  risk = "--",
  exposure = "--",
} = {}) {
  els.decisionState.textContent = stateLabel;
  els.decisionTitle.textContent = title;
  els.decisionCopy.textContent = copy;
  els.decisionAction.textContent = action;
  els.decisionMode.textContent = mode;
  els.decisionConfidence.textContent = confidence;
  els.decisionRisk.textContent = risk;
  els.decisionExposure.textContent = exposure;
}

function renderEvidence(items, badge = "待生成") {
  els.evidenceBadge.textContent = badge;
  els.evidenceGrid.innerHTML = items
    .map(
      (item) => `
        <article class="evidence-item">
          <header>
            <b>${escapeHtml(item.title)}</b>
            <span class="evidence-tag">${escapeHtml(item.tag)}</span>
          </header>
          <p>${escapeHtml(item.detail)}</p>
        </article>
      `,
    )
    .join("");
}

function renderDefaultEvidence() {
  renderEvidence(
    [
      {
        title: "单据来源",
        tag: "INPUT",
        detail: "等待上传 PDF/图片，或使用样例提单进入演示审单链路。",
      },
      {
        title: "字段抽取",
        tag: "识别",
        detail: "将提取发货人、收货人、提单号、货物描述、毛重、金额与港口信息。",
      },
      {
        title: "视觉复核",
        tag: "复核",
        detail: "多模态理解会复核遮挡、水印、折痕、印章与低置信度字段一致性。",
      },
      {
        title: "合规风控",
        tag: "校验",
        detail: "系统基于合规知识和贸易规则，输出 IMDG、OFAC、MSDS、UN38.3 风险结论。",
      },
    ],
    "待生成",
  );
}

function renderFields(fields = state.fields) {
  const labels = {
    shipper: "发货人",
    consignee: "收货人",
    blNumber: "提单号",
    goods: "货物描述",
    grossWeight: "毛重",
    amount: "货值",
    originPort: "起运港",
    destinationPort: "目的港",
  };

  els.fieldsGrid.innerHTML = Object.entries(labels)
    .map(
      ([key, label]) => `
        <div class="field-item">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(fields[key] || "--")}</strong>
        </div>
      `,
    )
    .join("");
}

function setActiveStep(stepName) {
  document.querySelectorAll(".step-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.step === stepName);
    card.classList.toggle("is-running", card.dataset.step === stepName);
  });
  if (!state.timeline.length && stepName === "ocr") return;
  const sectionByStep = {
    ocr: "documentSection",
    vl: "documentSection",
    rag: "riskSection",
    rwa: "financeSection",
  };
  if (sectionByStep[stepName]) openWorkSection(sectionByStep[stepName]);
}

function updateRouteStatus({
  eta = "18-22d",
  risk = "+12%",
  asset = "待生成",
  signal = "待命",
} = {}) {
  els.routeEta.textContent = eta;
  els.routeRisk.textContent = risk;
  els.routeAsset.textContent = asset;
  els.routeSignal.textContent = signal;
}

function updateCredentialVisual(status = "idle", hash = "--") {
  if (!els.credentialVisual) return;
  els.credentialVisual.dataset.status = status;
  const labels = {
    idle: "待生成",
    pricing: "资产定价完成",
    minting: "凭证生成中",
    minted: "凭证已生成",
    elevated: "风险已升高",
  };
  els.credentialVisualStatus.textContent = labels[status] || labels.idle;
  els.credentialVisualHash.textContent = hash && hash !== "--" ? hash : "等待资产凭证";
  if (els.credentialBrief) {
    const copy = {
      idle: "待生成：先完成识别与合规校验，再生成凭证。",
      pricing: "资产定价完成：LTV、评级和可融资额已经进入确权队列。",
      minting: "凭证生成中：系统正在把资产状态、融资解锁和审计日志写入凭证。",
      minted: "凭证已生成：可以下载审计 JSON 与合规报告，进入授信对接。",
      elevated: "风险已升高：事件监听触发转让锁，融资解锁比例需要复核。",
    };
    els.credentialBrief.textContent = copy[status] || copy.idle;
  }
}

function renderRisk(result) {
  const circumference = 314;
  const score = Math.max(0, Math.min(100, result.score));
  els.riskScore.textContent = score;
  els.meterValue.style.strokeDashoffset = String(circumference - (score / 100) * circumference);
  els.meterValue.style.stroke = score >= 70 ? "var(--red)" : score >= 45 ? "var(--amber)" : "var(--mint)";
  els.riskLevel.textContent = result.level;
  els.riskList.innerHTML = result.alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join("");
}

function renderFinance(result) {
  const amount = 2800000;
  const loan = amount * result.ltv;
  els.ltvValue.textContent = `${Math.round(result.ltv * 100)}%`;
  els.loanValue.textContent = formatCurrency(loan);
  els.ratingValue.textContent = result.rating;
  els.assetState.textContent = "可确权";
  els.mintBtn.disabled = false;
  return loan;
}

function inferRisk(fields) {
  const goods = `${fields.goods || ""}`.toLowerCase();
  const hasBattery = goods.includes("battery") || goods.includes("lithium") || goods.includes("电池");
  const malaysiaRoute = `${fields.destinationPort || ""}`.toLowerCase().includes("malaysia");
  const score = hasBattery ? 42 : 28;
  const adjusted = malaysiaRoute ? score + 6 : score;
  const alerts = [
    hasBattery
      ? "货物描述包含锂电池属性，需校验 UN38.3 测试摘要与 MSDS 文件。"
      : "未识别高危危险品关键词，建议保留人工抽检。",
    "建议核验提单号与船公司订舱信息的一致性。",
    "当前航线存在中等港口拥堵风险，资产评级需绑定实时航运事件。",
  ];

  return {
    score: adjusted,
    level: adjusted >= 70 ? "高风险" : adjusted >= 45 ? "中风险" : "低风险",
    alerts,
  };
}

function inferFinance(riskScore) {
  if (riskScore >= 70) return { ltv: 0.58, rating: "BBB" };
  if (riskScore >= 45) return { ltv: 0.7, rating: "AA" };
  return { ltv: 0.8, rating: "AAA" };
}

function endpointMode() {
  if (new URLSearchParams(window.location.search).has("demo")) return false;
  return LOCAL_API_HOSTS.has(window.location.hostname);
}

async function callBackend(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function simulateOracleRisk(news = "") {
  const isDelay = /typhoon|storm|delay|台风|延误|route/i.test(news);
  return {
    riskLevel: isDelay ? "MEDIUM" : "LOW",
    reason: isDelay ? "不可抗力导致延误" : "未识别严重航线扰动",
    contractInstruction: isDelay
      ? "开启转让锁；资产状态更新为风险升高；融资解锁比例下调至 60%"
      : "资产保持在途中；融资解锁比例维持 70%",
    assetStatus: isDelay ? "风险升高" : "在途中",
    transferLocked: isDelay,
    financingUnlocked: isDelay ? 0.6 : 0.7,
  };
}

function normalizeEventResult(result = {}) {
  const elevated = result.transferLocked || result.riskLevel === "MEDIUM" || result.assetStatus === "RISK_ELEVATED";
  return {
    ...result,
    riskLevel: elevated ? "MEDIUM" : "LOW",
    reason: elevated ? "不可抗力导致延误" : "未识别严重航线扰动",
    contractInstruction: elevated
      ? "开启转让锁；资产状态更新为风险升高；融资解锁比例下调至 60%"
      : "资产保持在途中；融资解锁比例维持 70%",
    assetStatus: elevated ? "风险升高" : "在途中",
    transferLocked: elevated,
    financingUnlocked: elevated ? 0.6 : 0.7,
  };
}

function normalizeApiResult(result) {
  if (!result) return null;
  const text = result.output_text || result.output?.[0]?.content?.[0]?.text;
  if (typeof text === "string") {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  if (result.data?.fields) {
    return {
      fields: result.data.fields,
      confidence: result.data.confidence,
    };
  }
  return result;
}

async function fileToDataUrl(file) {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function runOcr(documentData) {
  setActiveStep("ocr");
  els.docStatus.textContent = endpointMode() ? "多模态识别中" : "静态演示识别中";
  updateRouteStatus({ eta: "识别中", risk: "计算中", asset: "待生成", signal: "识别" });
  if (!endpointMode()) {
    pushTimeline("光学压缩感知", "公开静态站点使用样例单据进入演示链路", "DEMO");
    await sleep(760);
    return { fields: { ...demoFields }, confidence: 0.936 };
  }
  pushTimeline("单据识别", "多模态服务开始解析上传单据", "RUN");
  let result = {};
  try {
    result = normalizeApiResult(await callBackend("/api/analyze", {
      fileName: state.file?.name || "demo-bill-of-lading",
      mimeType: state.file?.type || "image/jpeg",
      dataUrl: documentData || "",
    })) || {};
  } catch (error) {
    const warning = `本地 API 不可用，已切换演示链路：${error.message}`;
    pushTimeline("后端代理", warning, "FALLBACK");
    await sleep(420);
    return { fields: { ...demoFields }, confidence: 0.936, warning };
  }
  state.backendResult = result;
  const extractedFields = result.fields && Object.values(result.fields).some((value) => String(value ?? "").trim())
    ? result.fields
    : demoFields;
  return {
    fields: extractedFields,
    confidence: result.confidence || 0.936,
    risk: result.risk,
    finance: result.finance,
    oracle: result.oracle,
    warning: result.warning,
  };
}

async function runVisionAudit(documentData, fields) {
  setActiveStep("vl");
  els.docStatus.textContent = "视觉复核中";
  updateRouteStatus({ eta: "18-22d", risk: "复核中", asset: "待生成", signal: "复核" });
  pushTimeline("视觉复核", "复核水印、遮挡与低置信度字段", "RUN");

  await sleep(820);
  return {
    fields,
    confidence: state.backendResult?.confidence || 0.982,
  };
}

async function runReview() {
  const start = performance.now();
  els.runBtn.disabled = true;
  els.runBtn.innerHTML = `${PLAY_ICON} 审单中`;
  const mode = endpointMode() ? "接口识别模式" : "演示模式";
  els.modeBadge.textContent = mode;
  updateCredentialVisual("idle");
  updateDecision({
    stateLabel: "链路运行中",
    title: "正在生成贸易资产风险画像",
    copy: "系统正在串联多模态单据识别、视觉复核、合规校验与动态资产定价。",
    action: "当前：感知 / 审计链路运行中",
    mode,
    confidence: "--",
    risk: "--",
    exposure: "--",
  });
  state.timeline = [];
  renderTimeline();

  try {
    const documentData = await fileToDataUrl(state.file);
    const ocr = await runOcr(documentData);
    state.fields = ocr.fields;
    state.confidence = ocr.confidence;
    renderFields();
    els.confidenceBadge.textContent = `置信度 ${(state.confidence * 100).toFixed(1)}%`;
    els.decisionConfidence.textContent = `${(state.confidence * 100).toFixed(1)}%`;
    pushTimeline("单据识别", "字段结构化完成", `${Math.round(state.confidence * 100)}%`);

    const audited = await runVisionAudit(documentData, state.fields);
    state.fields = audited.fields;
    state.confidence = audited.confidence;
    renderFields();
    els.confidenceBadge.textContent = `置信度 ${(state.confidence * 100).toFixed(1)}%`;
    els.decisionConfidence.textContent = `${(state.confidence * 100).toFixed(1)}%`;
    pushTimeline("视觉复核", "关键字段二次核验完成", `${Math.round(state.confidence * 100)}%`);

    setActiveStep("rag");
    els.docStatus.textContent = "合规校验中";
    updateRouteStatus({ eta: "18-22d", risk: "评分中", asset: "待生成", signal: "校验" });
    pushTimeline("合规校验", "识别隐含危险品属性并生成合规提示", "RUN");
    await sleep(640);
    const risk = ocr.risk || inferRisk(state.fields);
    state.riskScore = risk.score;
    renderRisk(risk);
    els.decisionRisk.textContent = `${risk.score} / 100`;
    pushTimeline("合规校验", `${risk.level}，生成 ${risk.alerts.length} 条合规提示`, risk.level);

    setActiveStep("rwa");
    els.docStatus.textContent = "资产定价完成";
    const finance = ocr.finance || inferFinance(state.riskScore);
    const loan = renderFinance(finance);
    renderOracleState(ocr.oracle || { assetStatus: "在途中", transferLocked: false, financingUnlocked: 0.6 });
    updateCredentialVisual("pricing");
    updateRouteStatus({
      eta: "18-22d",
      risk: `+${Math.max(8, risk.score - 36)}%`,
      asset: "在途中",
      signal: "就绪",
    });
    updateDecision({
      stateLabel: "决策已生成",
      title: `${risk.level}资产，可进入确权融资`,
      copy: `系统识别到 ${state.fields.goods}，结合单据可信度、IMDG/UN38.3 合规风险、航运事件与事件监听状态，建议以 ${Math.round(finance.ltv * 100)}% LTV 进行审慎授信。`,
      action: "下一步：生成资产凭证",
      mode,
      confidence: `${(state.confidence * 100).toFixed(1)}%`,
      risk: `${risk.score} / 100`,
      exposure: formatCurrency(loan),
    });
    renderEvidence(
      [
        {
          title: "单据可信度",
          tag: `${Math.round(state.confidence * 100)}%`,
          detail: `提单号 ${state.fields.blNumber} 与发货人、收货人、港口字段完成结构化抽取与视觉复核。`,
        },
        {
          title: "隐含合规风险",
          tag: risk.level,
          detail: risk.alerts[0],
        },
        {
          title: "航线事件",
          tag: "事件",
          detail: `${state.fields.originPort} 至 ${state.fields.destinationPort} 航线存在中等拥堵风险，系统需绑定航运与港口事件。`,
        },
        {
          title: "融资结论",
          tag: finance.rating,
          detail: `建议 LTV ${Math.round(finance.ltv * 100)}%，可融资额 ${formatCurrency(loan)}，进入动态 RWA 凭证生成与审计留痕。`,
        },
      ],
      "4 条证据",
    );
    openWorkSection("financeSection", { scroll: true });
    state.extractedJson = buildExtractedJson({
      risk,
      finance,
      loan,
      latencyMs: Math.round(performance.now() - start),
    });
    state.complianceReport = buildComplianceReport(risk, finance, loan);
    setDownloadReady(true);
    els.simulateNewsBtn.disabled = false;
    if (ocr.warning) pushTimeline("后端代理", ocr.warning, "FALLBACK");
    pushTimeline("动态 RWA 治理", `事件监听建议 LTV ${Math.round(finance.ltv * 100)}%，评级 ${finance.rating}`, "READY");

    els.latencyValue.textContent = `${Math.round(performance.now() - start)} ms`;
  } catch (error) {
    pushTimeline("接口异常", error.message, "ERR");
    els.docStatus.textContent = "接口异常";
    updateDecision({
      stateLabel: "链路异常",
      title: "接口调用未完成",
      copy: error.message,
      action: "下一步：检查 API 地址或切回演示模式",
      mode,
      confidence: els.decisionConfidence.textContent,
      risk: els.decisionRisk.textContent,
      exposure: els.decisionExposure.textContent,
    });
    els.runBtn.focus();
  } finally {
    els.runBtn.disabled = false;
    els.runBtn.innerHTML = `${PLAY_ICON} 开始审单`;
  }
}

function previewFile(file) {
  state.file = file;
  els.fileHint.textContent = file ? file.name : "支持 PDF 与图片文件";
  els.docStatus.textContent = file ? "已载入" : "待上传";

  if (!file || file.type === "application/pdf") {
    els.preview.innerHTML = `
      <div class="mock-document">
        <span>${file ? "PDF DOCUMENT" : "BILL OF LADING"}</span>
        <strong>${escapeHtml(file ? file.name : "MAEU-93827104")}</strong>
        <p>Shipper: Shenzhen Huadong Electronics Co., Ltd.</p>
        <p>Consignee: Klang Distribution Sdn. Bhd.</p>
        <p>Goods: Bluetooth Headphones with Lithium Batteries</p>
        <p>Gross Weight: 4,820 KG</p>
      </div>
    `;
    return;
  }

  const url = URL.createObjectURL(file);
  els.preview.innerHTML = `<img src="${url}" width="720" height="540" loading="lazy" alt="上传单据预览" />`;
}

function resetApp() {
  state.file = null;
  state.fields = { ...demoFields };
  state.confidence = 0;
  state.riskScore = 0;
  state.timeline = [];
  state.extractedJson = null;
  state.complianceReport = null;
  state.credentialId = null;
  state.backendResult = null;
  els.input.value = "";
  els.fileHint.textContent = "支持 PDF 与图片文件";
  els.docStatus.textContent = "待上传";
  els.confidenceBadge.textContent = "置信度 --";
  els.riskLevel.textContent = "待评估";
  els.riskScore.textContent = "--";
  els.meterValue.style.strokeDashoffset = "314";
  els.riskList.innerHTML = "";
  els.ltvValue.textContent = "--";
  els.loanValue.textContent = "--";
  els.ratingValue.textContent = "--";
  els.assetState.textContent = "未确权";
  els.mintBtn.disabled = true;
  els.simulateNewsBtn.disabled = true;
  els.tokenIdValue.textContent = "--";
  els.assetStatusValue.textContent = "待生成";
  els.assetStatusValue.classList.remove("status-warning");
  els.financingUnlockedValue.textContent = "--";
  els.transferLockValue.textContent = "关闭";
  els.oracleOutput.textContent = "等待事件监听结果。";
  updateCredentialVisual("idle");
  updateRouteStatus();
  setDownloadReady(false);
  els.mintBtn.innerHTML = `${ASSET_ICON} 生成 RWA 资产凭证`;
  els.modeBadge.textContent = endpointMode() ? "接口识别模式" : "演示模式";
  els.credentialNote.textContent = "资产凭证生成后可下载审计 JSON 与合规报告。";
  els.latencyValue.textContent = "-- ms";
  updateDecision();
  renderDefaultEvidence();
  setActiveStep("ocr");
  collapseWorkSections();
  renderFields();
  renderTimeline();
  previewFile(null);
}

els.input.addEventListener("change", (event) => {
  previewFile(event.target.files[0]);
});

els.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropZone.style.borderColor = "rgba(63, 109, 92, 0.72)";
});

els.dropZone.addEventListener("dragleave", () => {
  els.dropZone.style.borderColor = "";
});

els.dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  els.dropZone.style.borderColor = "";
  const file = event.dataTransfer.files[0];
  if (file) previewFile(file);
});

els.runBtn.addEventListener("click", runReview);
els.resetBtn.addEventListener("click", resetApp);

els.mintBtn.addEventListener("click", () => {
  if (!state.extractedJson) return;
  openWorkSection("financeSection");
  const hash = makeTokenHash();
  state.credentialId = hash;
  updateCredentialVisual("minting", "正在写入凭证哈希");
  els.mintAnimation.classList.add("active");
  setTimeout(() => els.mintAnimation.classList.remove("active"), 1800);
  els.assetState.textContent = "在途中";
  els.tokenIdValue.textContent = state.credentialId;
  els.assetStatusValue.textContent = "在途中";
  els.financingUnlockedValue.textContent = "60%";
  els.transferLockValue.textContent = "关闭";
  updateCredentialVisual("minted", state.credentialId);
  updateRouteStatus({
    eta: "18-22d",
    risk: els.decisionRisk.textContent === "--" ? "+12%" : els.routeRisk.textContent,
    asset: "已生成",
    signal: "已签名",
  });
  els.mintBtn.innerHTML = `${ASSET_ICON} RWA 凭证已生成`;
  updateDecision({
    stateLabel: "凭证已生成",
    title: "RWA 资产凭证已生成",
    copy: "资产元数据已生成，状态进入在途中；融资解锁 60%，等待事件监听持续更新在途风险。",
    action: "下一步：输入新闻事件并模拟链上状态更新",
    mode: els.modeBadge.textContent,
    confidence: els.decisionConfidence.textContent,
    risk: els.decisionRisk.textContent,
    exposure: els.decisionExposure.textContent,
  });
  state.extractedJson.credential = {
    id: state.credentialId,
    status: "在途中",
    financingUnlocked: "60%",
    auditLog: "RWA credential metadata generated and signing simulated",
  };
  if (state.complianceReport) {
    state.complianceReport.credentialId = state.credentialId;
    state.complianceReport.recommendedAction = "对接金融机构授信工作流，并持续绑定航运、港口拥堵与制裁事件。";
  }
  els.credentialNote.textContent = `凭证哈希 ${state.credentialId} 已生成，资产状态：在途中，融资解锁：60%。`;
  els.evidenceBadge.textContent = "已留痕";
  pushTimeline("动态 RWA 凭证", "生成链下资产凭证并写入审计日志", "MINT");
});

els.simulateNewsBtn.addEventListener("click", async () => {
  openWorkSection("eventSection");
  let rawResult;
  try {
    rawResult = endpointMode()
      ? await callBackend("/api/oracle-risk", { news: els.newsInput.value })
      : simulateOracleRisk(els.newsInput.value);
  } catch (error) {
    rawResult = simulateOracleRisk(els.newsInput.value);
    pushTimeline("事件监听", `本地事件接口不可用，已切换演示链路：${error.message}`, "DEMO");
  }
  const result = normalizeEventResult(rawResult);
  renderOracleState(result);
  updateRouteStatus({
    eta: result.transferLocked ? "21-25d" : "18-22d",
    risk: result.transferLocked ? "+24%" : "+10%",
    asset: result.transferLocked ? "风险升高" : "在途中",
    signal: result.riskLevel === "MEDIUM" ? "中风险" : "低风险",
  });
  if (result.transferLocked) updateCredentialVisual("elevated", state.credentialId || "风险升高，等待凭证");
  els.oracleOutput.textContent = JSON.stringify({
    风险等级: result.riskLevel === "MEDIUM" ? "中风险" : "低风险",
    原因: result.reason,
    状态更新指令: result.contractInstruction,
  }, null, 2);
  pushTimeline("事件监听", `${result.riskLevel === "MEDIUM" ? "中风险" : "低风险"} / ${result.reason}`, "事件");
});

els.downloadJsonBtn.addEventListener("click", () => {
  const payload = state.extractedJson || buildExtractedJson();
  downloadFile("extracted_trade_data.json", JSON.stringify(payload, null, 2), "application/json");
  els.credentialNote.textContent = "已下载 extracted_trade_data.json。";
});

els.downloadReportBtn.addEventListener("click", () => {
  const report = state.complianceReport || buildComplianceReport();
  downloadFile("compliance_report.pdf", buildCompliancePdf(report), "application/pdf");
  els.credentialNote.textContent = "已下载 compliance_report.pdf。";
});

els.viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    els.viewButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    focusWorkbenchPanel(button.dataset.focusTarget);
  });
});

els.moduleCards.forEach((card) => {
  card.addEventListener("click", () => {
    renderProductModule(card.dataset.module);
    const module = productModules[card.dataset.module] || productModules.perception;
    openWorkSection(module.section, { scroll: true });
  });
});

els.moduleJumpBtn.addEventListener("click", () => {
  openWorkSection(els.moduleJumpBtn.dataset.section || "documentSection");
  focusWorkbenchPanel(els.moduleJumpBtn.dataset.target || "documentPanel");
});

renderFields();
renderTimeline();
renderDefaultEvidence();
renderProductModule("perception");
setDownloadReady(false);
els.modeBadge.textContent = endpointMode() ? "接口识别模式" : "演示模式";
updateRouteStatus();
collapseWorkSections();
setupRevealEffects();

function buildExtractedJson({ risk = null, finance = null, loan = null, latencyMs = null } = {}) {
  return {
    documentType: "Bill of Lading",
    extractionEngine: "multimodal document recognition",
    auditAgent: "visual document verifier",
    fields: { ...state.fields },
    confidence: Number((state.confidence || 0.982).toFixed(3)),
    risk: risk || {
      score: state.riskScore || 48,
      level: els.riskLevel.textContent || "中风险",
      alerts: Array.from(els.riskList.querySelectorAll("li")).map((item) => item.textContent.replace(/^!\s*/, "")),
    },
    finance: finance || {
      ltv: 0.7,
      rating: els.ratingValue.textContent || "AA",
      loanAmount: els.loanValue.textContent || formatCurrency(1960000),
    },
    latencyMs,
    generatedAt: new Date().toISOString(),
  };
}

function buildComplianceReport(risk = null, finance = null, loan = null) {
  const activeRisk = risk || {
    score: state.riskScore || 48,
    level: els.riskLevel.textContent || "中风险",
    alerts: [
      "货物描述包含锂电池属性，需校验 UN38.3 测试摘要与 MSDS 文件。",
      "建议核验提单号与船公司订舱信息的一致性。",
      "当前航线存在中等港口拥堵风险，资产评级需绑定实时航运事件。",
    ],
  };
  const activeFinance = finance || { ltv: 0.7, rating: "AA" };
  return {
    title: "MetaTrade 合规报告",
    riskScore: activeRisk.score,
    riskLevel: activeRisk.level,
    flaggedEntities: [
      "蓝牙耳机",
      "锂电池",
      "UN38.3",
      "MSDS",
      "巴生港",
    ],
    analysisSummary: activeRisk.alerts.join(" "),
    recommendedAction: `建议 LTV ${Math.round(activeFinance.ltv * 100)}%，资产评级 ${activeFinance.rating}，可融资额 ${loan ? formatCurrency(loan) : els.loanValue.textContent || formatCurrency(1960000)}。发货前补全 UN38.3 与 MSDS，并绑定航运 / 港口拥堵事件。`,
    generatedAt: new Date().toISOString(),
  };
}

function setDownloadReady(ready) {
  els.downloadJsonBtn.disabled = !ready;
  els.downloadReportBtn.disabled = !ready;
}

function renderOracleState(oracle) {
  if (!oracle) return;
  const statusText = oracle.transferLocked ? "风险升高" : "在途中";
  els.assetStatusValue.textContent = statusText;
  els.assetState.textContent = statusText;
  els.assetStatusValue.classList.toggle("status-warning", Boolean(oracle.transferLocked));
  els.financingUnlockedValue.textContent = `${Math.round((oracle.financingUnlocked || 0.6) * 100)}%`;
  els.transferLockValue.textContent = oracle.transferLocked ? "开启" : "关闭";
  if (oracle.transferLocked) {
    els.credentialNote.textContent = "风险升高，资产转让已临时锁定。";
  }
}

function makeTokenHash() {
  const seed = `${Date.now()}-${state.fields.blNumber}-${state.fields.amount}-${Math.random()}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x45d9f3b;
  for (let i = 0; i < seed.length; i += 1) {
    const code = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  const left = (h1 >>> 0).toString(16).padStart(8, "0");
  const right = (h2 >>> 0).toString(16).padStart(8, "0");
  const tail = crypto?.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint8Array(8))).map((value) => value.toString(16).padStart(2, "0")).join("")
    : Date.now().toString(16);
  return `0x${left}${right}${tail}`.slice(0, 34);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pdfSafeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[()\\]/g, "\\$&");
}

function buildCompliancePdf(report) {
  const lines = [
    "MetaTrade Compliance Report",
    `Risk score: ${report.riskScore}`,
    `Risk level: ${report.riskLevel}`,
    `Flagged entities: ${report.flaggedEntities.join(", ")}`,
    `Analysis summary: ${report.analysisSummary}`,
    `Recommended action: ${report.recommendedAction}`,
    `Generated at: ${report.generatedAt}`,
  ].map(pdfSafeText);
  const textOps = lines.map((line, index) => `BT /F1 11 Tf 52 ${760 - index * 24} Td (${line}) Tj ET`).join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${textOps.length} >> stream\n${textOps}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}
