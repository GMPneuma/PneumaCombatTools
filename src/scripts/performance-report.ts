import type { Report } from "./performance-recorder.js";

export function summarize(report: Report): string[] {
  const lines: string[] = [];
  const groups = report.seconds.flatMap((s) => s.metrics);
  const metrics = (kind: string) => groups.filter((m) => m.key[0] === kind);
  type Metrics = typeof groups;
  const count = (rows: Metrics) => rows.reduce((n, m) => n + m.count, 0);
  const total = (rows: Metrics) => rows.reduce((n, m) => n + (m.totalMs ?? 0), 0);
  const worst = (rows: Metrics) => rows.reduce((n, m) => Math.max(n, m.maxMs ?? 0), 0);
  const fps = (rows: Metrics) =>
    total(rows) ? ((1000 * count(rows)) / total(rows)).toFixed(1) : "unavailable";
  const top = (rows: Metrics, label: (m: Metrics[number]) => string, duration = false) => {
    const values = new Map<string, number>();
    for (const m of rows) {
      const name = label(m);
      values.set(name, (values.get(name) ?? 0) + (duration ? (m.totalMs ?? 0) : m.count));
    }
    return [...values]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, n]) => name + " (" + (duration ? n.toFixed(1) + " ms" : n) + ")")
      .join(", ");
  };
  const username = (id: unknown) =>
    report.client.users.find((u) => u.id === id)?.name ?? String(id || "unknown");
  const offset = (n: number) => "+" + (n / 1000).toFixed(1) + "s";
  const first = report.seconds[0]?.second ?? 0;
  lines.push(
    (report.client.gm ? "GM" : "Player") +
      " capture for " +
      username(report.client.user) +
      ". " +
      report.startedAt +
      ". Window " +
      offset(first * 1000) +
      " to " +
      offset(report.elapsedMs) +
      (report.lagMarkMs !== null ? " (lag marked at end)." : "."),
  );
  const frames = metrics("browser.frame"),
    slow = frames.filter((m) => m.key[1] === "50–100ms" || m.key[1] === "100ms+");
  lines.push(
    "Foreground browser FPS " +
      fps(frames) +
      ". Canvas ticker FPS " +
      fps(metrics("canvas.tick")) +
      ". Frames of 50 ms or longer: " +
      count(slow) +
      ", totaling " +
      Math.round(total(slow)) +
      " ms. Worst frame: " +
      worst(frames).toFixed(1) +
      " ms.",
  );
  const chatFrames = frames.filter((m) => m.key[2] === "chat");
  const otherFrames = frames.filter((m) => m.key[2] && m.key[2] !== "chat");
  if (chatFrames.length && otherFrames.length) {
    lines.push(
      "With the chat tab selected: " +
        fps(chatFrames) +
        " browser FPS over " +
        (total(chatFrames) / 1000).toFixed(1) +
        "s. With another sidebar tab selected: " +
        fps(otherFrames) +
        " FPS over " +
        (total(otherFrames) / 1000).toFixed(1) +
        "s. A detached chat can remain visible.",
    );
  }
  const observed = report.minutes.filter((minute) => minute.frameMs >= 1000);
  if (observed.length > 1) {
    const describe = (minute: (typeof observed)[number]) =>
      ((1000 * minute.frames) / minute.frameMs).toFixed(1) +
      " FPS, " +
      minute.slowFrames +
      " slow frames and " +
      minute.renders +
      " chat renders";
    lines.push(
      "Session trend. Minute " +
        (observed[0]!.minute + 1) +
        ": " +
        describe(observed[0]!) +
        ". Minute " +
        (observed.at(-1)!.minute + 1) +
        ": " +
        describe(observed.at(-1)!) +
        ".",
    );
  }
  const longest = report.seconds
    .filter((s) => s.metrics.some((m) => m.key[0] === "browser.frame"))
    .sort(
      (a, b) =>
        worst(b.metrics.filter((m) => m.key[0] === "browser.frame")) -
        worst(a.metrics.filter((m) => m.key[0] === "browser.frame")),
    )[0];
  if (longest && count(slow)) {
    const same = longest.metrics;
    lines.push(
      "Worst frame occurred in second +" +
        longest.second +
        ". That second also had " +
        count(same.filter((m) => m.key[0] === "chat.render")) +
        " chat renders and " +
        count(same.filter((m) => m.key[0] === "document")) +
        " document changes. Timing alone cannot identify the cause.",
    );
  }
  const docs = metrics("document"),
    chat = docs.filter((m) => m.key[2] === "ChatMessage"),
    renders = metrics("chat.render");
  lines.push(
    "Chat messages: " +
      count(chat.filter((m) => m.key[1] === "create")) +
      " created, " +
      count(chat.filter((m) => m.key[1] === "update")) +
      " updated, " +
      count(renders) +
      " local renders. Most-rendered cards: " +
      (top(renders, (m) => String(m.key[2]) + " " + m.key[1]) || "none") +
      ".",
  );
  const sources = metrics("chat.refreshRequested");
  const invalidations = metrics("chat.invalidation");
  if (invalidations.length)
    lines.push(
      count(invalidations) +
        " pending-card invalidations resulted in " +
        count(metrics("chat.pendingRedraw")) +
        " redraw requests.",
    );
  if (sources.length)
    lines.push("Callers requesting chat refreshes: " + top(sources, (m) => String(m.key[1])) + ".");
  if (docs.length)
    lines.push("Most frequent document changes: " + top(docs, (m) => m.key[1] + " " + m.key[2]) + ".");
  const writers = metrics("document.localRequest").filter(
    (m) => m.key[2] === "ChatMessage" && m.key[1] === "update",
  );
  if (writers.length)
    lines.push("Local callers updating chat documents: " + top(writers, (m) => String(m.key[4])) + ".");
  const moduleTraffic = metrics("socket.module");
  if (moduleTraffic.length)
    lines.push(
      "Busiest module socket channels: " +
        top(moduleTraffic, (m) => m.key[2] + " " + (m.key[1] === "in" ? "received" : "sent")) +
        ".",
    );
  const work = metrics("work");
  if (work.length)
    lines.push(
      "Most measured handler time: " +
        top(work, (m) => m.key[1] + " / " + m.key[2], true) +
        ". Nested timings can overlap.",
    );
  const scripts = metrics("longFrame.script");
  if (scripts.length)
    lines.push(
      "Scripts attributed by the browser during long frames: " +
        top(scripts, (m) => String(m.key[1]), true) +
        ".",
    );
  const peak = report.seconds.reduce(
    (n, s) => Math.max(n, s.peakOutstanding, s.sample?.pendingRequests ?? 0),
    0,
  );
  if (report.client.gm) {
    const incoming = metrics("gm.incoming"),
      wait = metrics("gm.queueWait"),
      handling = metrics("gm.handling");
    lines.push(
      "GM received " +
        count(incoming) +
        " Combat Tools requests/actions. Peak outstanding requests: " +
        peak +
        ". Busiest players/actions: " +
        (top(incoming, (m) => username(m.key[3]) + " / " + m.key[2]) || "none") +
        ".",
    );
    if (wait.length)
      lines.push("Longest delay before a GM handler started: " + worst(wait).toFixed(1) + " ms.");
    if (handling.length)
      lines.push(
        "Longest time from GM handler start to reply: " +
          worst(handling).toFixed(1) +
          " ms, including any asynchronous waits.",
      );
  } else {
    const trips = metrics("client.roundTrip");
    lines.push(
      "Combat Tools requests sent: " +
        count(metrics("client.sent")) +
        ". Matched replies: " +
        count(trips) +
        (trips.length ? ". Longest round trip: " + worst(trips).toFixed(1) + " ms." : "."),
    );
  }
  const samples = report.seconds.flatMap((s) => (s.sample ? [s.sample] : []));
  const begin = samples[0],
    end = samples.at(-1);
  if (begin && end)
    lines.push(
      "Mounted chat cards: " +
        begin.chatCards +
        " → " +
        end.chatCards +
        ". Chat elements: " +
        begin.chatElements +
        " → " +
        end.chatElements +
        ". End sample: " +
        (end.sceneTokens ?? 0) +
        " scene tokens, " +
        end.combatants +
        " combatants, " +
        end.connectedUsers +
        " connected users, sidebar " +
        (end.sidebar ?? "unknown") +
        (end.sidebarCollapsed ? " (collapsed)" : "") +
        (end.chatPopoutOpen ? ", chat popped out" : "") +
        ".",
    );
  const heap = report.minutes.filter((m) => m.jsHeapMiB !== null);
  if (heap.length > 1)
    lines.push(
      "Browser-reported JS heap at the first and last sampled minutes: " +
        heap[0]!.jsHeapMiB +
        " and " +
        heap.at(-1)!.jsHeapMiB +
        " MiB.",
    );
  if (!report.capabilities.incoming || !report.capabilities.outgoing)
    lines.push("Socket timing coverage is incomplete on this client.");
  if (!report.capabilities.longFrames)
    lines.push("This browser does not expose long-frame script attribution.");
  const dropped = report.seconds.reduce((n, s) => n + s.overflow + s.droppedEvents, 0);
  if (dropped)
    lines.push(
      "Capture limits reached. " + dropped + " detailed records were omitted. See per-second counters.",
    );
  if (report.pendingAtStop || report.unmatchedOrExpiredRequests)
    lines.push(
      report.pendingAtStop +
        " requests outstanding at stop; " +
        report.unmatchedOrExpiredRequests +
        " expired or evicted during the session.",
    );
  return lines;
}

export function diagnosticFile(report: Report) {
  return {
    ...report,
    summary: summarize(report),
    format: {
      seconds: "Monotonic seconds since start. Only the last 60 one-second buckets are retained.",
      minutes:
        "One row per observed minute across the recording. Frame and ticker totals use foreground time. Module work totals can include nested handlers.",
      events:
        "Each row is [milliseconds since start, index into this second's metrics, optional duration in ms].",
      metrics:
        "count, cumulative duration and maximum duration for the dimensions in key. overflow counts omitted new groups. droppedEvents counts individual samples omitted for existing groups.",
      dimensions: {
        document: "operation, document type, UUID, originating Foundry user ID, card kind, changed fields",
        "document.localRequest":
          "operation, document type, UUID, synchronous module/system caller if visible in stack",
        "chat.render": "message ID, card kind (owner/format, independent of caller)",
        "chat.refreshRequested": "synchronous caller if visible, message ID, card kind",
        "chat.writeRequested": "writer module, workflow, message ID, originating request ID if known",
        work: "module, measured handler, message ID, triggering document UUIDs when supplied",
        "socket.module":
          "direction, module channel ID. Counts packets observed on this client, including broadcasts.",
        "chat.invalidation": "actor UUID and/or combat ID checked by the pending-card batch",
        "chat.pendingRedraw": "message ID submitted for redraw after a pending-card eligibility check",
        sockets:
          "protocol, action, requesting user ID, request ID, then message ID on request or outcome on reply",
        "gm.queueWait":
          "receive to instrumented handler entry (includes validation before entry, when applicable)",
        "gm.handling": "handler entry to outgoing reply, including asynchronous waits",
        "gm.receiveToReply": "incoming request to outgoing reply on the authoritative GM",
        "client.roundTrip": "outgoing request to incoming reply on the requesting client",
        "canvas.tick": "foreground intervals on the Foundry canvas ticker; not GPU presentation time",
        "browser.frame":
          "foreground requestAnimationFrame intervals, interval bucket and selected sidebar tab",
        "longFrame.script": "module/system from browser-reported script URL; attribution may be incomplete",
      },
      sample:
        "Chat DOM counts are sampled every five seconds and carried forward. Other context is sampled every second.",
      coverage:
        "Document hooks count local observations. Matching request IDs on tagged saves are direct links. Other nearby events establish timing only. Missing replies can fall outside the capture window.",
    },
  };
}
