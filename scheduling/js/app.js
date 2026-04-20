import {
  ALGORITHMS,
  LANGUAGES,
  PRESETS,
  PROBLEMS,
  SPEED_OPTIONS,
  STORAGE_KEYS,
  VIEW_MODES,
  buildRandomInstance,
  clampRandomSize,
  getAlgorithm,
  getDefaultPresetId,
  getPreset,
  parseCsvText,
} from "./data.js";
import { simulateProblem } from "./algorithms.js";
import { createTranslator, getHelpHtml, getReferencesHtml } from "./i18n.js";
import { renderInstanceTable, renderStateSummary, renderStepLog, renderSummaryCards, renderView } from "./render.js";

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

const elements = {
  eyebrowText: document.getElementById("eyebrowText"),
  appTitle: document.getElementById("appTitle"),
  appSubtitle: document.getElementById("appSubtitle"),
  controlsKicker: document.getElementById("controlsKicker"),
  controlsTitle: document.getElementById("controlsTitle"),
  problemLabel: document.getElementById("problemLabel"),
  algorithmLabel: document.getElementById("algorithmLabel"),
  presetLabel: document.getElementById("presetLabel"),
  randomSizeLabel: document.getElementById("randomSizeLabel"),
  randomActionLabel: document.getElementById("randomActionLabel"),
  generateRandomBtn: document.getElementById("generateRandomBtn"),
  csvLabel: document.getElementById("csvLabel"),
  resetBtn: document.getElementById("resetBtn"),
  stepBtn: document.getElementById("stepBtn"),
  autoBtn: document.getElementById("autoBtn"),
  completeBtn: document.getElementById("completeBtn"),
  speedLabel: document.getElementById("speedLabel"),
  stepCounterLabel: document.getElementById("stepCounterLabel"),
  stepCounterValue: document.getElementById("stepCounterValue"),
  problemSelect: document.getElementById("problemSelect"),
  algorithmSelect: document.getElementById("algorithmSelect"),
  presetSelect: document.getElementById("presetSelect"),
  randomSizeInput: document.getElementById("randomSizeInput"),
  csvInput: document.getElementById("csvInput"),
  speedSelect: document.getElementById("speedSelect"),
  summaryCards: document.getElementById("summaryCards"),
  statusBanner: document.getElementById("statusBanner"),
  viewTabs: [...document.querySelectorAll("#viewTabs .tab")],
  viewKicker: document.getElementById("viewKicker"),
  viewTitle: document.getElementById("viewTitle"),
  viewCaption: document.getElementById("viewCaption"),
  viewHost: document.getElementById("viewHost"),
  detailTabs: [...document.querySelectorAll("#detailsTabs .detail-tab")],
  detailPanes: [...document.querySelectorAll(".detail-pane")],
  detailsKicker: document.getElementById("detailsKicker"),
  detailsTitle: document.getElementById("detailsTitle"),
  stateSummary: document.getElementById("stateSummary"),
  instanceTable: document.getElementById("instanceTable"),
  stepLog: document.getElementById("stepLog"),
  liveBadge: document.getElementById("liveBadge"),
  helpBtn: document.getElementById("helpBtn"),
  referencesBtn: document.getElementById("referencesBtn"),
  themeToggle: document.getElementById("themeToggle"),
  langEnBtn: document.getElementById("langEnBtn"),
  langPtBtn: document.getElementById("langPtBtn"),
  helpOverlay: document.getElementById("helpOverlay"),
  helpTitle: document.getElementById("helpTitle"),
  helpContent: document.getElementById("helpContent"),
  helpCloseBtn: document.getElementById("helpCloseBtn"),
  referencesOverlay: document.getElementById("referencesOverlay"),
  referencesTitle: document.getElementById("referencesTitle"),
  referencesContent: document.getElementById("referencesContent"),
  referencesCloseBtn: document.getElementById("referencesCloseBtn"),
  footerRepoLabel: document.getElementById("footerRepoLabel"),
  footerLicenseLabel: document.getElementById("footerLicenseLabel"),
  footerReferencesBtn: document.getElementById("footerReferencesBtn"),
  footerAiText: document.getElementById("footerAiText"),
};

const initialLanguage = LANGUAGES.includes(localStorage.getItem(STORAGE_KEYS.language))
  ? localStorage.getItem(STORAGE_KEYS.language)
  : "en";
const initialTheme = localStorage.getItem(STORAGE_KEYS.theme) === "dark" ? "dark" : "light";
const initialProblemId = "intervalScheduling";
const initialAlgorithmId = ALGORITHMS[initialProblemId][0].id;
const initialPresetId = getDefaultPresetId(initialProblemId);
const initialItems = cloneData(getPreset(initialProblemId, initialPresetId)?.items ?? PRESETS[initialProblemId][0].items);

const state = {
  language: initialLanguage,
  theme: initialTheme,
  t: createTranslator(initialLanguage),
  problemId: initialProblemId,
  algorithmId: initialAlgorithmId,
  presetId: initialPresetId,
  items: initialItems,
  viewMode: VIEW_MODES[0],
  detailMode: "summary",
  stepIndex: 0,
  simulation: simulateProblem(initialProblemId, initialAlgorithmId, initialItems),
  autoRunHandle: null,
  autoRunning: false,
  speed: 1,
  statusKey: "banner_preset_loaded",
  statusParams: {},
};

const DETAIL_LABEL_KEYS = {
  summary: "details_summary",
  state: "details_state",
  data: "details_data",
  log: "details_log",
};

function setStatus(key, params = {}) {
  state.statusKey = key;
  state.statusParams = params;
}

function updateTranslator() {
  state.t = createTranslator(state.language);
}

function updateTheme() {
  document.body.dataset.theme = state.theme;
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  elements.themeToggle.textContent = state.theme === "dark" ? "☾" : "☀";
}

function populateProblemOptions() {
  const t = state.t;
  elements.problemSelect.innerHTML = Object.values(PROBLEMS)
    .map(
      (problem) => `
        <option value="${problem.id}" ${problem.id === state.problemId ? "selected" : ""}>
          ${t(problem.labelKey)}
        </option>
      `,
    )
    .join("");
}

function populateAlgorithmOptions() {
  const t = state.t;
  elements.algorithmSelect.innerHTML = ALGORITHMS[state.problemId]
    .map(
      (algorithm) => `
        <option value="${algorithm.id}" ${algorithm.id === state.algorithmId ? "selected" : ""}>
          ${t(algorithm.labelKey)}
        </option>
      `,
    )
    .join("");
}

function populatePresetOptions() {
  const t = state.t;
  const customOption =
    state.presetId === ""
      ? `<option value="" selected>${t("preset_custom")}</option>`
      : "";

  elements.presetSelect.innerHTML = `${customOption}${PRESETS[state.problemId]
    .map(
      (preset) => `
        <option value="${preset.id}" title="${t(preset.descriptionKey)}" ${preset.id === state.presetId ? "selected" : ""}>
          ${t(preset.labelKey)}
        </option>
      `,
    )
    .join("")}`;
}

function populateSpeedOptions() {
  elements.speedSelect.innerHTML = SPEED_OPTIONS.map(
    (speed) => `<option value="${speed}" ${speed === state.speed ? "selected" : ""}>${speed}x</option>`,
  ).join("");
}

function refreshSimulation(resetStep = true) {
  state.simulation = simulateProblem(state.problemId, state.algorithmId, state.items);
  if (resetStep) {
    state.stepIndex = 0;
  } else {
    state.stepIndex = Math.min(state.stepIndex, state.simulation.steps.length - 1);
  }
}

function getCurrentPreset() {
  return getPreset(state.problemId, state.presetId);
}

function getCurrentProblem() {
  return PROBLEMS[state.problemId];
}

function getCurrentAlgorithm() {
  return getAlgorithm(state.problemId, state.algorithmId);
}

function updateStaticText() {
  const t = state.t;
  elements.eyebrowText.textContent = t("eyebrow");
  elements.appTitle.textContent = t("app_title");
  elements.appSubtitle.textContent = t("app_subtitle");
  elements.controlsKicker.textContent = t("controls_kicker");
  elements.controlsTitle.textContent = t("controls_title");
  elements.problemLabel.textContent = t("problem_label");
  elements.algorithmLabel.textContent = t("algorithm_label");
  elements.presetLabel.textContent = t("preset_label");
  elements.randomSizeLabel.textContent = t("random_size_label");
  elements.randomActionLabel.textContent = t("random_action_label");
  elements.generateRandomBtn.textContent = t("random_btn");
  elements.csvLabel.textContent = t("csv_label");
  elements.resetBtn.textContent = t("reset_btn");
  elements.stepBtn.textContent = t("step_btn");
  elements.completeBtn.textContent = t("complete_btn");
  elements.speedLabel.textContent = t("speed_label");
  elements.stepCounterLabel.textContent = t("step_counter_label");
  elements.viewTabs[0].textContent = t("view_code");
  elements.viewTabs[1].textContent = t("view_interval");
  elements.viewTabs[2].textContent = t("view_graph");
  elements.viewTabs[3].textContent = t("view_proof");
  elements.viewKicker.textContent = t("view_kicker");
  elements.viewCaption.textContent = t("board_caption");
  elements.detailsKicker.textContent = t("details_kicker");
  elements.detailsTitle.textContent = t("details_title");
  elements.detailTabs.forEach((tab) => {
    tab.textContent = t(DETAIL_LABEL_KEYS[tab.dataset.detail]);
  });
  elements.helpTitle.textContent = t("help_title");
  elements.helpCloseBtn.textContent = t("close_btn");
  elements.referencesTitle.textContent = t("references_title");
  elements.referencesCloseBtn.textContent = t("close_btn");
  elements.footerRepoLabel.textContent = t("footer_repo");
  elements.footerLicenseLabel.textContent = t("footer_license");
  elements.footerReferencesBtn.textContent = t("footer_references");
  elements.footerAiText.textContent = t("footer_ai");
  elements.helpContent.innerHTML = getHelpHtml(state.language, t);
  elements.referencesContent.innerHTML = getReferencesHtml(state.language);
  elements.themeToggle.setAttribute("aria-label", state.theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

function updateLiveBadge() {
  const t = state.t;
  if (state.autoRunning) {
    elements.liveBadge.textContent = t("live_running");
    elements.liveBadge.className = "live-badge live-running";
    return;
  }
  if (state.stepIndex >= state.simulation.steps.length - 1) {
    elements.liveBadge.textContent = t("live_complete");
    elements.liveBadge.className = "live-badge live-complete";
    return;
  }
  elements.liveBadge.textContent = t("live_ready");
  elements.liveBadge.className = "live-badge";
}

function initResizableHandles(root = document) {
  root.querySelectorAll(".resize-handle").forEach((handle) => {
    if (handle.dataset.bound === "true") {
      return;
    }
    handle.dataset.bound = "true";
    handle.addEventListener("pointerdown", (event) => {
      if (window.matchMedia("(max-width: 1200px)").matches) {
        return;
      }

      const container = document.getElementById(handle.dataset.resizeTarget);
      const paneSelector = handle.dataset.resizePane;
      const axis = handle.dataset.resizeAxis;
      const variableName = handle.dataset.resizeVar;
      const pane = paneSelector ? container?.querySelector(paneSelector) : null;
      if (!container || !pane || !axis || !variableName) {
        return;
      }

      event.preventDefault();
      const paneRect = pane.getBoundingClientRect();
      const startPointer = axis === "x" ? event.clientX : event.clientY;
      const startSize = axis === "x" ? paneRect.width : paneRect.height;
      const min = Number(handle.dataset.min ?? 160);
      const max = Number(handle.dataset.max ?? 1200);

      document.body.classList.add("is-resizing");
      handle.classList.add("is-active");
      handle.setPointerCapture?.(event.pointerId);

      const move = (moveEvent) => {
        const delta = (axis === "x" ? moveEvent.clientX : moveEvent.clientY) - startPointer;
        const nextSize = Math.max(min, Math.min(max, startSize + delta));
        container.style.setProperty(variableName, `${nextSize}px`);
      };

      const stop = () => {
        document.body.classList.remove("is-resizing");
        handle.classList.remove("is-active");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
    });
  });
}

function render() {
  const t = state.t;
  const problem = getCurrentProblem();
  const algorithm = getCurrentAlgorithm();
  const preset = getCurrentPreset();
  const currentStep = state.simulation.steps[state.stepIndex];

  populateProblemOptions();
  populateAlgorithmOptions();
  populatePresetOptions();
  populateSpeedOptions();
  updateStaticText();

  elements.langEnBtn.classList.toggle("active", state.language === "en");
  elements.langPtBtn.classList.toggle("active", state.language === "pt-BR");
  elements.viewTabs.forEach((tab) => {
    const isActive = tab.dataset.view === state.viewMode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  elements.detailTabs.forEach((tab) => {
    const isActive = tab.dataset.detail === state.detailMode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  elements.detailPanes.forEach((pane) => {
    pane.classList.toggle("active", pane.dataset.detailPanel === state.detailMode);
  });
  elements.autoBtn.textContent = t(state.autoRunning ? "stop_btn" : "auto_btn");
  elements.viewTitle.textContent = t(`view_title_${state.viewMode}`);
  elements.stepCounterValue.textContent = `${state.stepIndex + 1} / ${state.simulation.steps.length}`;
  elements.summaryCards.innerHTML = renderSummaryCards(problem, algorithm, preset, state.simulation, t);
  elements.statusBanner.textContent = t(state.statusKey, state.statusParams);
  elements.stateSummary.innerHTML = renderStateSummary(state.problemId, state.simulation, currentStep, t);
  elements.instanceTable.innerHTML = renderInstanceTable(state.problemId, state.simulation, currentStep, t);
  elements.stepLog.innerHTML = renderStepLog(state.simulation.steps, state.stepIndex, t);
  elements.viewHost.innerHTML = renderView(state.viewMode, state.problemId, algorithm, state.simulation, currentStep, t);
  updateLiveBadge();
  initResizableHandles(document);
}

function stopAutoRun(silent = false) {
  if (state.autoRunHandle) {
    window.clearTimeout(state.autoRunHandle);
    state.autoRunHandle = null;
  }
  const wasRunning = state.autoRunning;
  state.autoRunning = false;
  if (!silent && wasRunning) {
    setStatus("banner_autorun_stopped");
  }
}

function queueAutoRun() {
  if (!state.autoRunning) {
    return;
  }

  if (state.stepIndex >= state.simulation.steps.length - 1) {
    stopAutoRun(true);
    setStatus("banner_done");
    render();
    return;
  }

  const delay = Math.max(120, Math.round(900 / state.speed));
  state.autoRunHandle = window.setTimeout(() => {
    state.stepIndex += 1;
    render();
    queueAutoRun();
  }, delay);
}

function switchProblem(problemId) {
  stopAutoRun(true);
  state.problemId = problemId;
  state.algorithmId = ALGORITHMS[problemId][0].id;
  state.presetId = getDefaultPresetId(problemId);
  state.items = cloneData(getPreset(problemId, state.presetId)?.items ?? []);
  refreshSimulation(true);
  setStatus("banner_preset_loaded");
  render();
}

function switchAlgorithm(algorithmId) {
  stopAutoRun(true);
  state.algorithmId = algorithmId;
  refreshSimulation(true);
  setStatus("banner_reset");
  render();
}

function switchPreset(presetId) {
  stopAutoRun(true);
  state.presetId = presetId;
  state.items = cloneData(getPreset(state.problemId, presetId)?.items ?? []);
  refreshSimulation(true);
  setStatus("banner_preset_loaded");
  render();
}

function generateRandom() {
  stopAutoRun(true);
  const size = clampRandomSize(Number(elements.randomSizeInput.value));
  elements.randomSizeInput.value = String(size);
  state.presetId = "";
  state.items = buildRandomInstance(state.problemId, size);
  refreshSimulation(true);
  setStatus("banner_random_loaded");
  render();
}

async function importCsv(file) {
  if (!file) {
    return;
  }
  try {
    stopAutoRun(true);
    const text = await file.text();
    state.items = parseCsvText(state.problemId, text);
    state.presetId = "";
    refreshSimulation(true);
    setStatus("banner_csv_loaded");
  } catch (error) {
    const reasonKey = error instanceof Error ? error.message : "invalid_csv_numbers";
    setStatus("banner_csv_error", { reason: state.t(reasonKey) });
  } finally {
    elements.csvInput.value = "";
    render();
  }
}

function stepForward() {
  stopAutoRun(true);
  if (state.stepIndex >= state.simulation.steps.length - 1) {
    setStatus("banner_done");
    render();
    return;
  }
  state.stepIndex += 1;
  render();
}

function resetExecution() {
  stopAutoRun(true);
  state.stepIndex = 0;
  setStatus("banner_reset");
  render();
}

function runToCompletion() {
  stopAutoRun(true);
  state.stepIndex = state.simulation.steps.length - 1;
  setStatus("banner_done");
  render();
}

function toggleAutoRun() {
  if (state.autoRunning) {
    stopAutoRun();
    render();
    return;
  }
  if (state.stepIndex >= state.simulation.steps.length - 1) {
    setStatus("banner_done");
    render();
    return;
  }
  state.autoRunning = true;
  setStatus("banner_autorun_started");
  render();
  queueAutoRun();
}

function openModal(modal) {
  modal.hidden = false;
}

function closeModal(modal) {
  modal.hidden = true;
}

function setLanguage(language) {
  if (!LANGUAGES.includes(language)) {
    return;
  }
  state.language = language;
  localStorage.setItem(STORAGE_KEYS.language, language);
  updateTranslator();
  render();
}

function setTheme(theme) {
  state.theme = theme;
  updateTheme();
  render();
}

function bindEvents() {
  elements.problemSelect.addEventListener("change", (event) => switchProblem(event.target.value));
  elements.algorithmSelect.addEventListener("change", (event) => switchAlgorithm(event.target.value));
  elements.presetSelect.addEventListener("change", (event) => switchPreset(event.target.value));
  elements.generateRandomBtn.addEventListener("click", generateRandom);
  elements.csvInput.addEventListener("change", (event) => importCsv(event.target.files?.[0]));
  elements.resetBtn.addEventListener("click", resetExecution);
  elements.stepBtn.addEventListener("click", stepForward);
  elements.autoBtn.addEventListener("click", toggleAutoRun);
  elements.completeBtn.addEventListener("click", runToCompletion);
  elements.speedSelect.addEventListener("change", (event) => {
    state.speed = Number(event.target.value);
    if (state.autoRunning) {
      stopAutoRun(true);
      state.autoRunning = true;
      queueAutoRun();
    }
    render();
  });

  elements.viewTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.viewMode = tab.dataset.view;
      render();
    });
  });

  elements.detailTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.detailMode = tab.dataset.detail;
      render();
    });
  });

  elements.helpBtn.addEventListener("click", () => openModal(elements.helpOverlay));
  elements.referencesBtn.addEventListener("click", () => openModal(elements.referencesOverlay));
  elements.footerReferencesBtn.addEventListener("click", () => openModal(elements.referencesOverlay));
  elements.helpCloseBtn.addEventListener("click", () => closeModal(elements.helpOverlay));
  elements.referencesCloseBtn.addEventListener("click", () => closeModal(elements.referencesOverlay));
  elements.helpOverlay.addEventListener("click", (event) => {
    if (event.target === elements.helpOverlay) {
      closeModal(elements.helpOverlay);
    }
  });
  elements.referencesOverlay.addEventListener("click", (event) => {
    if (event.target === elements.referencesOverlay) {
      closeModal(elements.referencesOverlay);
    }
  });

  elements.themeToggle.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
  elements.langEnBtn.addEventListener("click", () => setLanguage("en"));
  elements.langPtBtn.addEventListener("click", () => setLanguage("pt-BR"));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal(elements.helpOverlay);
      closeModal(elements.referencesOverlay);
    }
  });
}

function init() {
  updateTranslator();
  updateTheme();
  bindEvents();
  initResizableHandles(document);
  render();
}

init();
