import { diagnosticFile, summarize } from "./performance-report.js";
import { savedCapture, startCapture, stopCapture, type Report } from "./performance-recorder.js";

const reportEndpoint = "https://pneuma-report-inbox.jeremygnj.chatgpt.site/api/reports";
let shareThisCapture = false;
let upload: {status: "sending" | "failed" | "sent"; message: string} | undefined;

function refreshRecorder() {
  for (const app of Object.values(ui.windows)) if (app instanceof PerformanceSettings) app.render(false);
}

async function sendReport(report: Report) {
  if (upload && upload.status !== "failed") return;
  upload = {status: "sending", message: "Sending the full report to Pneuma…"};
  refreshRecorder();
  try {
    const response = await fetch(reportEndpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(diagnosticFile(report)),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error("Upload failed");
    const result: unknown = await response.json();
    const id = result && typeof result === "object" && "id" in result ? result.id : undefined;
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error("Missing receipt");
    upload = {status: "sent", message: "Pneuma received report " + id + "."};
    ui.notifications?.info(upload.message);
  } catch {
    upload = {status: "failed", message: "Delivery was not confirmed. Retry or export your report from Performance Recorder."};
    ui.notifications?.warn(upload.message);
  }
  refreshRecorder();
}

function finishCapture(marked: boolean) {
  if (!globalThis.pneumaPerformance) return false;
  const report = stopCapture(marked);
  const share = shareThisCapture;
  shareThisCapture = false;
  if (share && report) void sendReport(report);
  else {
    if (marked) ui.notifications?.info("Lag marked. Export the last minute from Performance Recorder.");
    refreshRecorder();
  }
  return true;
}
class PerformanceSettings extends FormApplication {
  constructor() {
    super({});
  }
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "pneuma-performance-recorder",
      title: "Performance Recorder",
      template: "modules/pneuma-combattools/templates/performance-recorder.hbs",
      width: 430,
      height: "auto",
    }) as typeof FormApplication.defaultOptions;
  }
  override getData() {
    const report = savedCapture();
    return {
      recording: !!globalThis.pneumaPerformance,
      shareThisCapture,
      saved: !!report,
      summary: report ? summarize(report) : [],
      uploadMessage: upload?.message,
      uploading: upload?.status === "sending",
      canRetry: upload?.status === "failed",
    };
  }
  override activateListeners(html: JQuery) {
    super.activateListeners(html);
    html.find("[data-start]").on("click", () => {
      if (globalThis.pneumaPerformance || upload?.status === "sending") return;
      const share = html.find("[data-share-report]").is(":checked");
      startCapture();
      shareThisCapture = share;
      upload = undefined;
      refreshRecorder();
    });
    html.find("[data-stop]").on("click", () => finishCapture(false));
    html.find("[data-mark]").on("click", () => finishCapture(true));
    html.find("[data-retry]").on("click", () => {
      const report = savedCapture();
      if (report && upload?.status === "failed") void sendReport(report);
    });
    html.find("[data-export]").on("click", (event) => {
      const report = savedCapture();
      if (!report) return;
      const name =
        "pneuma-performance-" +
        (report.client.gm ? "gm" : "player") +
        "-" +
        report.startedAt.replace(/[:.]/g, "-");
      if (event.currentTarget.dataset.export === "summary")
        saveDataToFile(summarize(report).join("\n"), "text/plain", name + ".txt");
      else saveDataToFile(JSON.stringify(diagnosticFile(report)), "application/json", name + ".json");
    });
  }
  protected override async _updateObject() {}
}
export function registerPerformanceRecorder() {
  game.settings!.registerMenu("pneuma-combattools", "performanceRecorder", {
    name: "Performance Recorder",
    label: "Open recorder",
    hint: "Record this client and export the full data or a readable summary.",
    icon: "fas fa-stopwatch",
    type: PerformanceSettings,
    restricted: false,
  });
  game.keybindings!.register("pneuma-combattools", "markPerformanceLag", {
    name: "Mark lag and freeze performance recording",
    editable: [{ key: "KeyL", modifiers: ["Alt", "Shift"] }],
    onDown: () => finishCapture(true),
  });
}
