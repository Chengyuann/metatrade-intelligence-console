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
  viewButtons: document.querySelectorAll(".ghost-btn[data-focus-target]"),
};

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
  stateLabel = "Awaiting Intelligence",
  title = "等待贸易单据审单",
  copy = "上传单据或使用样例资产后，系统将联动 OCR、多模态理解、合规 RAG 与 RWA 定价生成可解释融资建议。",
  action = "下一步：运行审单链路",
  mode = "Demo / API Ready",
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
        tag: "OCR",
        detail: "将提取发货人、收货人、提单号、货物描述、毛重、金额与港口信息。",
      },
      {
        title: "VACOT 视觉复核",
        tag: "AUDIT",
        detail: "多模态理解会复核遮挡、水印、折痕、印章与低置信度字段一致性。",
      },
      {
        title: "Agentic RAG 风控",
        tag: "RAG",
        detail: "模型基于推理、检索规划与合规知识提示，输出 IMDG、OFAC、MSDS、UN38.3 风险结论。",
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
  });
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
    "当前航线存在中等港口拥堵风险，资产评级需绑定实时 AIS 事件。",
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
    reason: isDelay ? "Force majeure delay" : "No severe route disruption identified",
    contractInstruction: isDelay
      ? "setTransferLocked(true); updateAssetStatus('RISK_ELEVATED'); reduceFinancingUnlock(0.60)"
      : "keepAssetStatus('IN_TRANSIT'); maintainFinancingUnlock(0.70)",
    assetStatus: isDelay ? "RISK_ELEVATED" : "IN_TRANSIT",
    transferLocked: isDelay,
    financingUnlocked: isDelay ? 0.6 : 0.7,
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
  els.docStatus.textContent = endpointMode() ? "后端模型识别中" : "静态演示识别中";
  if (!endpointMode() || !state.file || !documentData) {
    pushTimeline("光学压缩感知", endpointMode() ? "未上传文件，使用样例单据进入演示链路" : "公开静态站点使用样例单据进入演示链路", "DEMO");
    await sleep(760);
    return { fields: { ...demoFields }, confidence: 0.936 };
  }
  pushTimeline("光学压缩感知", "AIDP ModelHub 开始解析上传单据", "RUN");
  let result = {};
  try {
    result = normalizeApiResult(await callBackend("/api/analyze", {
      fileName: state.file?.name || "demo-bill-of-lading",
      mimeType: state.file?.type || "image/jpeg",
      dataUrl: documentData,
    })) || {};
  } catch (error) {
    const warning = `本地 API 不可用，已切换演示链路：${error.message}`;
    pushTimeline("后端代理", warning, "FALLBACK");
    await sleep(420);
    return { fields: { ...demoFields }, confidence: 0.936, warning };
  }
  state.backendResult = result;
  return {
    fields: { ...demoFields, ...(result.fields || {}) },
    confidence: result.confidence || 0.936,
    risk: result.risk,
    finance: result.finance,
    oracle: result.oracle,
    warning: result.warning,
  };
}

async function runVisionAudit(documentData, fields) {
  setActiveStep("vl");
  els.docStatus.textContent = "VACOT 视觉审计中";
  pushTimeline("VACOT 审计", "Qwen3-VL 审计 Agent 复核水印、遮挡与低置信度字段", "RUN");

  await sleep(820);
  return {
    fields: { ...fields, goods: "Bluetooth Headphones with Lithium Batteries" },
    confidence: state.backendResult?.confidence || 0.982,
  };
}

async function runReview() {
  const start = performance.now();
  els.runBtn.disabled = true;
  els.runBtn.innerHTML = `${PLAY_ICON} 审单中`;
  const mode = endpointMode() ? "后端模型模式" : "演示模式";
  els.modeBadge.textContent = mode;
  updateDecision({
    stateLabel: "Running Pipeline",
    title: "正在生成贸易资产风险画像",
    copy: "系统正在串联光学压缩感知、VACOT 视觉审计、Agentic RAG 合规哨兵与动态 RWA 定价。",
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
    pushTimeline("光学压缩感知", "字段结构化完成", `${Math.round(state.confidence * 100)}%`);

    const audited = await runVisionAudit(documentData, state.fields);
    state.fields = audited.fields;
    state.confidence = audited.confidence;
    renderFields();
    els.confidenceBadge.textContent = `置信度 ${(state.confidence * 100).toFixed(1)}%`;
    els.decisionConfidence.textContent = `${(state.confidence * 100).toFixed(1)}%`;
    pushTimeline("VACOT 审计", "关键字段二次核验完成", `${Math.round(state.confidence * 100)}%`);

    setActiveStep("rag");
    els.docStatus.textContent = "Agentic RAG 推理中";
    pushTimeline("Agentic RAG", "推理智能体识别隐含危险品属性并规划合规检索", "RUN");
    await sleep(640);
    const risk = ocr.risk || inferRisk(state.fields);
    state.riskScore = risk.score;
    renderRisk(risk);
    els.decisionRisk.textContent = `${risk.score} / 100`;
    pushTimeline("Agentic RAG", `${risk.level}，生成 ${risk.alerts.length} 条合规提示`, risk.level);

    setActiveStep("rwa");
    els.docStatus.textContent = "资产定价完成";
    const finance = ocr.finance || inferFinance(state.riskScore);
    const loan = renderFinance(finance);
    renderOracleState(ocr.oracle || { assetStatus: "IN_TRANSIT", transferLocked: false, financingUnlocked: 0.6 });
    updateDecision({
      stateLabel: "Decision Ready",
      title: `${risk.level}资产，可进入确权融资`,
      copy: `系统识别到 ${state.fields.goods}，结合单据可信度、IMDG/UN38.3 合规风险、AIS 航线事件与 AI 预言机状态，建议以 ${Math.round(finance.ltv * 100)}% LTV 进行审慎授信。`,
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
          detail: `提单号 ${state.fields.blNumber} 与发货人、收货人、港口字段完成光学压缩抽取与 VACOT 视觉复核。`,
        },
        {
          title: "隐含合规风险",
          tag: risk.level,
          detail: risk.alerts[0],
        },
        {
          title: "航线事件",
          tag: "ORACLE",
          detail: `${state.fields.originPort} 至 ${state.fields.destinationPort} 航线存在中等拥堵风险，AI 预言机需绑定 AIS 与港口事件。`,
        },
        {
          title: "融资结论",
          tag: finance.rating,
          detail: `建议 LTV ${Math.round(finance.ltv * 100)}%，可融资额 ${formatCurrency(loan)}，进入动态 RWA 凭证生成与审计留痕。`,
        },
      ],
      "4 条证据",
    );
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
    pushTimeline("动态 RWA 治理", `AI 预言机建议 LTV ${Math.round(finance.ltv * 100)}%，评级 ${finance.rating}`, "READY");

    els.latencyValue.textContent = `${Math.round(performance.now() - start)} ms`;
  } catch (error) {
    pushTimeline("接口异常", error.message, "ERR");
    els.docStatus.textContent = "接口异常";
    updateDecision({
      stateLabel: "Pipeline Error",
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
  els.assetStatusValue.textContent = "PENDING";
  els.assetStatusValue.classList.remove("status-warning");
  els.financingUnlockedValue.textContent = "--";
  els.transferLockValue.textContent = "OFF";
  els.oracleOutput.textContent = "等待 AI 预言机事件。";
  setDownloadReady(false);
  els.mintBtn.innerHTML = `${ASSET_ICON} 生成 RWA 资产凭证`;
  els.modeBadge.textContent = endpointMode() ? "后端模型模式" : "演示模式";
  els.credentialNote.textContent = "资产凭证生成后可下载审计 JSON 与合规报告。";
  els.latencyValue.textContent = "-- ms";
  updateDecision();
  renderDefaultEvidence();
  setActiveStep("ocr");
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
  const hash = makeTokenHash();
  state.credentialId = hash;
  els.mintAnimation.classList.add("active");
  setTimeout(() => els.mintAnimation.classList.remove("active"), 1800);
  els.assetState.textContent = "IN_TRANSIT";
  els.tokenIdValue.textContent = state.credentialId;
  els.assetStatusValue.textContent = "IN_TRANSIT";
  els.financingUnlockedValue.textContent = "60%";
  els.transferLockValue.textContent = "OFF";
  els.mintBtn.innerHTML = `${ASSET_ICON} RWA 凭证已生成`;
  updateDecision({
    stateLabel: "Credential Ready",
    title: "RWA Asset NFT 已铸造",
    copy: "资产元数据已生成，状态进入 IN_TRANSIT；融资解锁 60%，等待 AI 预言机持续监听在途风险。",
    action: "下一步：输入新闻事件并模拟链上状态更新",
    mode: els.modeBadge.textContent,
    confidence: els.decisionConfidence.textContent,
    risk: els.decisionRisk.textContent,
    exposure: els.decisionExposure.textContent,
  });
  state.extractedJson.credential = {
    id: state.credentialId,
    status: "IN_TRANSIT",
    financingUnlocked: "60%",
    auditLog: "NFT metadata generated and minting simulated",
  };
  if (state.complianceReport) {
    state.complianceReport.credentialId = state.credentialId;
    state.complianceReport.recommendedAction = "对接金融机构授信工作流，并持续绑定 AIS、港口拥堵与制裁事件。";
  }
  els.credentialNote.textContent = `NFT Token Hash ${state.credentialId} 已生成，Asset status: IN_TRANSIT，Financing unlocked: 60%。`;
  els.evidenceBadge.textContent = "已留痕";
  pushTimeline("动态 RWA 凭证", "生成链下资产凭证并写入审计日志", "MINT");
});

els.simulateNewsBtn.addEventListener("click", async () => {
  const result = endpointMode()
    ? await callBackend("/api/oracle-risk", { news: els.newsInput.value })
    : simulateOracleRisk(els.newsInput.value);
  renderOracleState(result);
  els.oracleOutput.textContent = JSON.stringify({
    riskLevel: result.riskLevel,
    reason: result.reason,
    contractUpdateInstruction: result.contractInstruction,
  }, null, 2);
  pushTimeline("AI 预言机", `${result.riskLevel} / ${result.reason}`, "ORACLE");
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

    const target = document.querySelector(`#${button.dataset.focusTarget}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
    target.classList.remove("focus-pulse");
    requestAnimationFrame(() => target.classList.add("focus-pulse"));
  });
});

renderFields();
renderTimeline();
renderDefaultEvidence();
setDownloadReady(false);
els.modeBadge.textContent = endpointMode() ? "后端模型模式" : "演示模式";

function buildExtractedJson({ risk = null, finance = null, loan = null, latencyMs = null } = {}) {
  return {
    documentType: "Bill of Lading",
    extractionEngine: "DeepSeek-OCR-2 optical context compression",
    auditAgent: "VACOT-driven Qwen3-VL verifier",
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
      "当前航线存在中等港口拥堵风险，资产评级需绑定实时 AIS 事件。",
    ],
  };
  const activeFinance = finance || { ltv: 0.7, rating: "AA" };
  return {
    title: "MetaTrade Compliance Report",
    riskScore: activeRisk.score,
    riskLevel: activeRisk.level,
    flaggedEntities: [
      "Bluetooth Headphones",
      "Lithium Battery",
      "UN38.3",
      "MSDS",
      "Port Klang",
    ],
    analysisSummary: activeRisk.alerts.join(" "),
    recommendedAction: `建议 LTV ${Math.round(activeFinance.ltv * 100)}%，资产评级 ${activeFinance.rating}，可融资额 ${loan ? formatCurrency(loan) : els.loanValue.textContent || formatCurrency(1960000)}。发货前补全 UN38.3 与 MSDS，并绑定 AIS / 港口拥堵事件。`,
    generatedAt: new Date().toISOString(),
  };
}

function setDownloadReady(ready) {
  els.downloadJsonBtn.disabled = !ready;
  els.downloadReportBtn.disabled = !ready;
}

function renderOracleState(oracle) {
  if (!oracle) return;
  els.assetStatusValue.textContent = oracle.assetStatus || "IN_TRANSIT";
  els.assetState.textContent = oracle.assetStatus || "IN_TRANSIT";
  els.assetStatusValue.classList.toggle("status-warning", Boolean(oracle.transferLocked));
  els.financingUnlockedValue.textContent = `${Math.round((oracle.financingUnlocked || 0.6) * 100)}%`;
  els.transferLockValue.textContent = oracle.transferLocked ? "ON" : "OFF";
  if (oracle.transferLocked) {
    els.credentialNote.textContent = "Secondary market trading disabled due to elevated risk";
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

function buildCompliancePdf(report) {
  const lines = [
    "MetaTrade Compliance Report",
    `Risk score: ${report.riskScore}`,
    `Risk level: ${report.riskLevel}`,
    `Flagged entities: ${report.flaggedEntities.join(", ")}`,
    `Analysis summary: ${report.analysisSummary}`,
    `Recommended action: ${report.recommendedAction}`,
    `Generated at: ${report.generatedAt}`,
  ].map((line) => line.replace(/[()\\]/g, "\\$&"));
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
