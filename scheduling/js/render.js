import { buildConflictEdges } from "./algorithms.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value)) {
      return String(value);
    }
    return value.toFixed(2);
  }
  return String(value);
}

function getDisplayItems(simulation, stepState) {
  return stepState?.isSorted ? simulation.sortedItems : simulation.items;
}

function getRoomColorClass(roomId) {
  if (!roomId) {
    return "";
  }
  return `room-color-${((roomId - 1) % 6) + 1}`;
}

function getStatusForItem(problemId, itemId, stepState) {
  if (!stepState) {
    return "pending";
  }

  if (stepState.currentId === itemId) {
    return "current";
  }

  if (problemId === "intervalScheduling") {
    if (stepState.selectedIds?.includes(itemId)) {
      return "selected";
    }
    if (stepState.rejectedIds?.includes(itemId)) {
      return "rejected";
    }
    if (stepState.processedIds?.includes(itemId)) {
      return "processed";
    }
    return "pending";
  }

  if (problemId === "intervalPartitioning") {
    if (stepState.assignedIds?.includes(itemId)) {
      return "assigned";
    }
    return "pending";
  }

  if (stepState.scheduled?.some((job) => job.id === itemId)) {
    return "scheduled";
  }
  return "pending";
}

function getStatusLabelKey(status) {
  if (status === "selected") return "status_selected";
  if (status === "rejected") return "status_rejected";
  if (status === "assigned") return "status_assigned";
  if (status === "scheduled") return "status_scheduled";
  if (status === "current") return "status_current";
  if (status === "processed") return "status_processed";
  return "status_pending";
}

function getNormalizedGap(problem, simulation) {
  if (problem.goal === "maximize") {
    return simulation.optimal.objectiveValue - simulation.result.objectiveValue;
  }
  return simulation.result.objectiveValue - simulation.optimal.objectiveValue;
}

function getRoomAssignmentMap(rooms) {
  const mapping = new Map();
  for (const room of rooms ?? []) {
    for (const item of room.items ?? []) {
      mapping.set(item.id, room.roomId);
    }
  }
  return mapping;
}

function buildPseudocode(problemId, algorithm, t) {
  if (problemId === "intervalScheduling") {
    return [
      { text: t("code_sched_1", { rule: t(algorithm.comparatorKey) }), indent: 0 },
      { text: t("code_sched_2"), indent: 0 },
      { text: t("code_sched_3"), indent: 0 },
      { text: t("code_sched_4"), indent: 1 },
      { text: t("code_sched_5"), indent: 2 },
      { text: t("code_sched_6"), indent: 1 },
      { text: t("code_sched_7"), indent: 0 },
    ];
  }
  if (problemId === "intervalPartitioning") {
    return [
      { text: t("code_part_1", { rule: t(algorithm.comparatorKey) }), indent: 0 },
      { text: t("code_part_2"), indent: 0 },
      { text: t("code_part_3"), indent: 0 },
      { text: t("code_part_4"), indent: 1 },
      { text: t("code_part_5"), indent: 2 },
      { text: t("code_part_6"), indent: 1 },
      { text: t("code_part_7"), indent: 0 },
    ];
  }
  return [
    { text: t("code_late_1", { rule: t(algorithm.comparatorKey) }), indent: 0 },
    { text: t("code_late_2"), indent: 0 },
    { text: t("code_late_3"), indent: 0 },
    { text: t("code_late_4"), indent: 1 },
    { text: t("code_late_5"), indent: 1 },
    { text: t("code_late_6"), indent: 1 },
    { text: t("code_late_7"), indent: 1 },
    { text: t("code_late_8"), indent: 0 },
  ];
}

function buildTimelineBounds(problemId, simulation, stepState) {
  if (problemId === "minimizeLateness") {
    const schedule = stepState?.scheduled ?? [];
    const finalSchedule = schedule.length > 0 ? schedule : simulation.result.schedule ?? [];
    const maxDeadline = Math.max(...simulation.items.map((item) => item.deadline), 0);
    const maxFinish = Math.max(...finalSchedule.map((item) => item.finish), 0);
    return {
      min: 0,
      max: Math.max(maxDeadline, maxFinish, 1),
    };
  }

  const starts = simulation.items.map((item) => item.start);
  const finishes = simulation.items.map((item) => item.finish);
  return {
    min: Math.min(...starts, 0),
    max: Math.max(...finishes, 1),
  };
}

function xScale(value, bounds, width, padding) {
  if (bounds.max === bounds.min) {
    return padding;
  }
  return padding + ((value - bounds.min) / (bounds.max - bounds.min)) * (width - padding * 2);
}

function getBoardZoom(boardState, viewMode) {
  return boardState?.zoom?.[viewMode] ?? 1;
}

function getBoardOffset(boardState, problemId, itemId) {
  return boardState?.offsets?.[problemId]?.[itemId] ?? { x: 0, y: 0 };
}

function renderBoardFigure(viewMode, legendMarkup, svgMarkup, boardState, t, hint = "", note = "") {
  const zoom = Math.round(getBoardZoom(boardState, viewMode) * 100);
  return `
    <div class="board-figure" data-board-figure="${viewMode}">
      <div class="board-tools">
        <div class="board-tools-copy">
          ${legendMarkup}
          ${hint ? `<p class="board-hint">${hint}</p>` : ""}
          ${note ? `<p class="board-note">${note}</p>` : ""}
        </div>
        <div class="zoom-panel" role="group" aria-label="${t("zoom_controls_label")}">
          <button type="button" class="zoom-btn secondary" data-zoom-action="out" aria-label="${t("zoom_out_label")}">−</button>
          <output class="zoom-readout" data-zoom-readout>${zoom}%</output>
          <button type="button" class="zoom-btn secondary" data-zoom-action="in" aria-label="${t("zoom_in_label")}">+</button>
          <button type="button" class="zoom-fit-btn secondary" data-zoom-action="reset" aria-label="${t("zoom_reset_label")}">${t("zoom_fit_btn")}</button>
        </div>
      </div>
      <div class="board-stage" data-board-stage>
        ${svgMarkup}
      </div>
    </div>
  `;
}

function buildAxis(bounds, width, height, tickCount = 8) {
  const padding = 52;
  const ticks = [];
  for (let index = 0; index <= tickCount; index += 1) {
    const value = bounds.min + ((bounds.max - bounds.min) * index) / tickCount;
    const x = xScale(value, bounds, width, padding);
    ticks.push(`
      <line x1="${x}" y1="${height - 28}" x2="${x}" y2="28" class="axis-grid"></line>
      <text x="${x}" y="${height - 10}" class="axis-label" text-anchor="middle">${formatValue(value)}</text>
    `);
  }
  return ticks.join("");
}

function renderDataChips(problemId, simulation, stepState, t) {
  if (problemId === "intervalScheduling") {
    const thirdLabel = simulation.algorithmId === "fewest-conflicts" ? t("state_considered") : t("state_last_finish");
    const thirdValue = simulation.algorithmId === "fewest-conflicts"
      ? stepState.processedIds?.length ?? 0
      : formatValue(stepState.lastFinish);
    return `
      <div class="chip-grid">
        <div class="data-chip"><span>${t("state_selected")}</span><strong>${stepState.selectedIds?.length ?? 0}</strong></div>
        <div class="data-chip"><span>${t("state_rejected")}</span><strong>${stepState.rejectedIds?.length ?? 0}</strong></div>
        <div class="data-chip"><span>${thirdLabel}</span><strong>${thirdValue}</strong></div>
      </div>
    `;
  }
  if (problemId === "intervalPartitioning") {
    return `
      <div class="chip-grid">
        <div class="data-chip"><span>${t("state_rooms_open")}</span><strong>${stepState.rooms?.length ?? 0}</strong></div>
        <div class="data-chip"><span>${t("state_assigned")}</span><strong>${stepState.assignedIds?.length ?? 0}</strong></div>
        <div class="data-chip"><span>${t("state_depth_bound")}</span><strong>${simulation.optimal.objectiveValue}</strong></div>
      </div>
    `;
  }
  return `
    <div class="chip-grid">
      <div class="data-chip"><span>${t("state_scheduled_jobs")}</span><strong>${stepState.scheduled?.length ?? 0}</strong></div>
      <div class="data-chip"><span>${t("state_time")}</span><strong>${formatValue(stepState.time)}</strong></div>
      <div class="data-chip"><span>${t("state_max_lateness")}</span><strong>${formatValue(stepState.maxLateness)}</strong></div>
    </div>
  `;
}

function renderStructuredItems(problemId, items, stepState, t) {
  return `
    <div class="item-card-grid">
      ${items
        .map((item) => {
          const status = getStatusForItem(problemId, item.id, stepState);
          const extra =
            problemId === "minimizeLateness"
              ? `${t("header_duration_short")}: ${item.duration} · ${t("header_deadline_short")}: ${item.deadline}`
              : `${t("header_start_short")}: ${item.start} · ${t("header_finish_short")}: ${item.finish}`;
          const meta =
            problemId === "minimizeLateness"
              ? `${t("header_slack_short")}: ${item.slack}`
              : `${t("header_length_short")}: ${item.duration} · ${t("header_conflicts_short")}: ${item.conflicts}`;
          return `
            <article class="item-card status-${status}">
              <div class="item-card-head">
                <strong>${escapeHtml(item.id)}</strong>
                <span>${t(getStatusLabelKey(status))}</span>
              </div>
              <p>${extra}</p>
              <p>${meta}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderResultStructure(problemId, simulation, stepState, t) {
  if (problemId === "intervalScheduling") {
    return `
      <div class="subpanel">
        <h3>${t("result_selected_set")}</h3>
        <div class="pill-row">
          ${(stepState.selectedIds ?? []).map((id) => `<span class="pill success">${escapeHtml(id)}</span>`).join("") || `<span class="muted">${t("empty_selected")}</span>`}
        </div>
      </div>
    `;
  }
  if (problemId === "intervalPartitioning") {
    return `
      <div class="subpanel">
        <h3>${t("result_rooms")}</h3>
        <div class="room-list">
          ${(stepState.rooms ?? [])
            .map(
              (room) => `
                <div class="room-card">
                  <strong>${t("room_label", { room: room.roomId })}</strong>
                  <div class="pill-row">
                    ${room.items.map((item) => `<span class="pill room">${escapeHtml(item.id)}</span>`).join("")}
                  </div>
                </div>
              `,
            )
            .join("") || `<span class="muted">${t("empty_rooms")}</span>`}
        </div>
      </div>
    `;
  }
  return `
    <div class="subpanel">
      <h3>${t("result_schedule")}</h3>
      <div class="schedule-list">
        ${(stepState.scheduled ?? [])
          .map(
            (item) => `
              <div class="schedule-row">
                <strong>${escapeHtml(item.id)}</strong>
                <span>[${item.start}, ${item.finish}]</span>
                <span>${t("header_lateness_short")}: ${item.lateness}</span>
              </div>
            `,
          )
          .join("") || `<span class="muted">${t("empty_schedule")}</span>`}
      </div>
    </div>
  `;
}

function renderCodeView(problemId, algorithm, simulation, step, t) {
  const lines = buildPseudocode(problemId, algorithm, t);
  const displayItems = getDisplayItems(simulation, step.state);
  return `
    <div class="code-layout split-layout" id="codeSplit">
      <section class="subpanel" data-pane="primary">
        <h3>${t("view_code")}</h3>
        <ol class="code-list">
          ${lines
            .map(
              (line, index) => `
                <li class="${step.line === index + 1 ? "active" : ""}" style="--code-indent:${line.indent}">
                  <span class="line-no">${index + 1}</span>
                  <code class="code-content">${escapeHtml(line.text)}</code>
                </li>
              `,
            )
            .join("")}
        </ol>
      </section>
      <div
        class="resize-handle resize-handle-x"
        data-resize-target="codeSplit"
        data-resize-axis="x"
        data-resize-var="--code-left"
        data-resize-pane="[data-pane='primary']"
        data-min="280"
        data-max="920"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize code and data panels"
      ></div>
      <section class="subpanel">
        <h3>${t("data_structure_title")}</h3>
        ${renderDataChips(problemId, simulation, step.state, t)}
        ${renderStructuredItems(problemId, displayItems, step.state, t)}
        ${renderResultStructure(problemId, simulation, step.state, t)}
      </section>
    </div>
  `;
}

function renderIntervalSchedulingSvg(simulation, step, t, boardState) {
  const width = 900;
  const rowHeight = 56;
  const padding = 52;
  const bounds = buildTimelineBounds("intervalScheduling", simulation, step.state);
  const rows = [...simulation.items].sort((a, b) => a.start - b.start || a.finish - b.finish || a.id.localeCompare(b.id));
  const height = rows.length * rowHeight + 84;
  const bars = rows
    .map((item, index) => {
      const status = getStatusForItem("intervalScheduling", item.id, step.state);
      const offset = getBoardOffset(boardState, "intervalScheduling", item.id);
      const x = xScale(item.start, bounds, width, padding);
      const end = xScale(item.finish, bounds, width, padding);
      const y = 36 + index * rowHeight;
      const label = end - x >= 26 ? escapeHtml(item.id) : "";
      const translate = offset.y ? ` transform="translate(0 ${offset.y})"` : "";
      return `
        <g
          class="timeline-row status-${status} draggable-item drag-y"
          data-drag-item
          data-problem-id="intervalScheduling"
          data-item-id="${escapeHtml(item.id)}"
          data-drag-axis="y"
          data-min-offset="${28 - y}"
          data-max-offset="${height - 58 - y}"
          ${translate}
        >
          <text x="14" y="${y + 18}" class="row-label">${escapeHtml(item.id)}</text>
          <rect x="${x}" y="${y}" width="${Math.max(end - x, 16)}" height="22" rx="10" class="interval-bar status-${status}"></rect>
          ${label ? `<text x="${(x + end) / 2}" y="${y + 15}" class="bar-label" text-anchor="middle">${label}</text>` : ""}
        </g>
      `;
    })
    .join("");

  return renderBoardFigure(
    "interval",
    `
      <div class="legend-row">
        <span class="legend-item"><i class="swatch status-selected"></i>${t("status_selected")}</span>
        <span class="legend-item"><i class="swatch status-rejected"></i>${t("status_rejected")}</span>
        <span class="legend-item"><i class="swatch status-current"></i>${t("status_current")}</span>
      </div>
    `,
    `
      <svg viewBox="0 0 ${width} ${height}" class="timeline-svg" data-board-svg aria-label="${t("view_interval")}">
        ${buildAxis(bounds, width, height)}
        ${bars}
      </svg>
    `,
    boardState,
    t,
    t("board_hint_drag_vertical"),
  );
}

function renderPartitioningSvg(simulation, step, t, boardState) {
  const width = 900;
  const displayItems = getDisplayItems(simulation, step.state);
  const bounds = buildTimelineBounds("intervalPartitioning", simulation, step.state);
  const rowHeight = 58;
  const padding = 52;
  const height = Math.max(220, displayItems.length * rowHeight + 84);
  const roomAssignments = getRoomAssignmentMap(step.state.rooms);

  const bars = displayItems
    .map((item, index) => {
      const offset = getBoardOffset(boardState, "intervalPartitioning", item.id);
      const x = xScale(item.start, bounds, width, padding);
      const end = xScale(item.finish, bounds, width, padding);
      const y = 36 + index * rowHeight;
      const label = end - x >= 26 ? escapeHtml(item.id) : "";
      const roomId = roomAssignments.get(item.id);
      const fillClass = roomId ? getRoomColorClass(roomId) : "partition-preview";
      const currentClass = item.id === step.state.currentId ? " room-current" : "";
      const translate = offset.y ? ` transform="translate(0 ${offset.y})"` : "";
      return `
        <g
          class="timeline-row draggable-item drag-y"
          data-drag-item
          data-problem-id="intervalPartitioning"
          data-item-id="${escapeHtml(item.id)}"
          data-drag-axis="y"
          data-min-offset="${28 - y}"
          data-max-offset="${height - 58 - y}"
          ${translate}
        >
          <text x="14" y="${y + 18}" class="row-label">${escapeHtml(item.id)}</text>
          <rect x="${x}" y="${y}" width="${Math.max(end - x, 18)}" height="24" rx="12" class="interval-bar ${fillClass}${currentClass}"></rect>
          ${label ? `<text x="${(x + end) / 2}" y="${y + 16}" class="bar-label" text-anchor="middle">${label}</text>` : ""}
        </g>
      `;
    })
    .join("");

  return renderBoardFigure(
    "interval",
    `
      <div class="legend-row">
        <span class="legend-item"><i class="swatch partition-preview-swatch"></i>${t("partition_preview_label")}</span>
        <span class="legend-item"><i class="swatch room-color-1"></i>${t("legend_room_assignment")}</span>
        <span class="legend-item"><i class="swatch status-current"></i>${t("status_current")}</span>
      </div>
    `,
    `
      <svg viewBox="0 0 ${width} ${height}" class="timeline-svg" data-board-svg aria-label="${t("view_interval")}">
        ${buildAxis(bounds, width, height)}
        ${bars}
      </svg>
    `,
    boardState,
    t,
    t("board_hint_drag_vertical"),
  );
}

function renderLatenessSvg(simulation, step, t, boardState) {
  const width = 920;
  const displayItems = getDisplayItems(simulation, step.state);
  const scheduleMap = new Map((step.state.scheduled ?? []).map((item) => [item.id, item]));
  const rowHeight = 58;
  const height = Math.max(220, 84 + displayItems.length * rowHeight);
  const bounds = buildTimelineBounds("minimizeLateness", simulation, step.state);
  const padding = 52;

  const bars = displayItems
    .map((item, index) => {
      const scheduled = scheduleMap.get(item.id);
      const status = getStatusForItem("minimizeLateness", item.id, step.state);
      const start = scheduled ? scheduled.start : 0;
      const finish = scheduled ? scheduled.finish : item.duration;
      const x = xScale(start, bounds, width, padding);
      const end = xScale(finish, bounds, width, padding);
      const deadlineX = xScale(item.deadline, bounds, width, padding);
      const y = 36 + index * rowHeight;
      const offset = getBoardOffset(boardState, "minimizeLateness", item.id);
      const translate = offset.x ? ` transform="translate(${offset.x} 0)"` : "";
      const visualStart = Math.max(x, deadlineX - (offset.x ?? 0));
      const latenessWidth = Math.max(0, end - visualStart);
      return `
        <g class="timeline-row status-${status}">
          <line x1="${deadlineX}" y1="${y - 10}" x2="${deadlineX}" y2="${y + 26}" class="deadline-line"></line>
          <text x="${deadlineX}" y="${y - 16}" class="axis-label" text-anchor="middle">${escapeHtml(item.id)}: d=${item.deadline}</text>
        </g>
        <g
          class="timeline-row draggable-item drag-x status-${status}"
          data-drag-item
          data-problem-id="minimizeLateness"
          data-item-id="${escapeHtml(item.id)}"
          data-drag-axis="x"
          data-min-offset="${padding - x}"
          data-max-offset="${width - padding - end}"
          ${translate}
        >
          <rect x="${x}" y="${y}" width="${Math.max(end - x, 24)}" height="24" rx="12" class="interval-bar ${scheduled ? "status-scheduled" : `status-${status}`} lateness-preview"></rect>
          ${latenessWidth > 0 ? `<rect x="${visualStart}" y="${y}" width="${latenessWidth}" height="24" rx="12" class="lateness-bar"></rect>` : ""}
          <text x="${(x + end) / 2}" y="${y + 16}" class="bar-label" text-anchor="middle">${escapeHtml(item.id)}</text>
        </g>
      `;
    })
    .join("");

  return renderBoardFigure(
    "interval",
    `
      <div class="legend-row">
        <span class="legend-item"><i class="swatch status-scheduled"></i>${t("status_scheduled")}</span>
        <span class="legend-item"><i class="swatch lateness-swatch"></i>${t("legend_lateness")}</span>
        <span class="legend-item"><i class="swatch deadline-swatch"></i>${t("legend_deadline")}</span>
      </div>
    `,
    `
      <svg viewBox="0 0 ${width} ${height}" class="timeline-svg" data-board-svg aria-label="${t("view_interval")}">
        ${buildAxis(bounds, width, height, 10)}
        ${bars}
      </svg>
    `,
    boardState,
    t,
    t("board_hint_drag_horizontal"),
  );
}

function renderIntervalView(problemId, simulation, step, t, boardState) {
  if (problemId === "intervalScheduling") {
    return renderIntervalSchedulingSvg(simulation, step, t, boardState);
  }
  if (problemId === "intervalPartitioning") {
    return renderPartitioningSvg(simulation, step, t, boardState);
  }
  return renderLatenessSvg(simulation, step, t, boardState);
}

function renderConflictGraph(problemId, simulation, step, t, boardState) {
  if (problemId === "minimizeLateness") {
    return renderInversionGraph(simulation, step, t, boardState);
  }

  const width = 820;
  const height = 540;
  const radius = 180;
  const centerX = width / 2;
  const centerY = height / 2;
  const edges = buildConflictEdges(problemId, simulation.items);
  const roomAssignments = getRoomAssignmentMap(step.state.rooms);
  const nodes = simulation.items.map((item, index) => {
    const angle = (-Math.PI / 2) + (index / Math.max(simulation.items.length, 1)) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const status = getStatusForItem(problemId, item.id, step.state);
    const roomId = roomAssignments.get(item.id);
    return { ...item, x, y, status, roomId };
  });
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const legendMarkup =
    problemId === "intervalPartitioning"
      ? `
        <span class="legend-item"><i class="swatch graph-edge-swatch"></i>${t("legend_conflict_edge")}</span>
        <span class="legend-item"><i class="swatch room-color-1"></i>${t("legend_room_assignment")}</span>
        <span class="legend-item"><i class="swatch status-current"></i>${t("status_current")}</span>
      `
      : `
        <span class="legend-item"><i class="swatch graph-edge-swatch"></i>${t("legend_conflict_edge")}</span>
        <span class="legend-item"><i class="swatch status-selected"></i>${t("status_selected")}</span>
        <span class="legend-item"><i class="swatch status-current"></i>${t("status_current")}</span>
      `;

  return renderBoardFigure(
    "graph",
    `
      <div class="legend-row">
        ${legendMarkup}
      </div>
    `,
    `
      <svg viewBox="0 0 ${width} ${height}" class="graph-svg" data-board-svg aria-label="${t("view_graph")}">
        ${edges
          .map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="graph-edge"></line>`;
          })
          .join("")}
        ${nodes
          .map(
            (node) => {
              const roomClass = problemId === "intervalPartitioning" && node.roomId ? getRoomColorClass(node.roomId) : `status-${node.status}`;
              const currentClass = node.status === "current" ? " graph-node-current-ring" : "";
              return `
              <g>
                <circle cx="${node.x}" cy="${node.y}" r="28" class="graph-node ${roomClass}${currentClass}"></circle>
                <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" class="graph-label">${escapeHtml(node.id)}</text>
              </g>
            `;
            },
          )
          .join("")}
      </svg>
    `,
    boardState,
    t,
  );
}

function renderInversionGraph(simulation, step, t, boardState) {
  const width = 840;
  const height = 320;
  const schedule = step.state.scheduled ?? [];
  const edges = buildConflictEdges("minimizeLateness", simulation.items, schedule);
  const nodes = schedule.map((item, index) => ({
    ...item,
    x: 110 + index * ((width - 220) / Math.max(schedule.length - 1, 1)),
    y: 190,
    status: item.id === step.state.currentId ? "current" : "scheduled",
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const arcs = edges
    .map((edge, index) => {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) {
        return "";
      }
      const midX = (from.x + to.x) / 2;
      const heightOffset = 40 + (index % 4) * 20;
      return `
        <path
          d="M ${from.x} ${from.y - 18} Q ${midX} ${from.y - 18 - heightOffset} ${to.x} ${to.y - 18}"
          class="inversion-edge"
        ></path>
      `;
    })
    .join("");

  return renderBoardFigure(
    "graph",
    `
      <div class="legend-row">
        <span class="legend-item"><i class="swatch inversion-swatch"></i>${t("legend_inversion_edge")}</span>
        <span class="legend-item"><i class="swatch status-current"></i>${t("status_current")}</span>
      </div>
    `,
    `
      <svg viewBox="0 0 ${width} ${height}" class="graph-svg" data-board-svg aria-label="${t("view_graph")}">
        <line x1="72" y1="190" x2="${width - 72}" y2="190" class="axis-grid"></line>
        ${arcs}
        ${nodes
          .map(
            (node) => `
              <g>
                <circle cx="${node.x}" cy="${node.y}" r="26" class="graph-node status-${node.status}"></circle>
                <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" class="graph-label">${escapeHtml(node.id)}</text>
                <text x="${node.x}" y="${node.y + 48}" text-anchor="middle" class="axis-label">d=${node.deadline}</text>
              </g>
            `,
          )
          .join("")}
      </svg>
    `,
    boardState,
    t,
    "",
    t("lateness_graph_note"),
  );
}

function renderProofView(problemId, algorithm, simulation, step, t) {
  if (!algorithm.optimal) {
    const gap =
      problemId === "intervalScheduling"
        ? simulation.optimal.objectiveValue - simulation.result.objectiveValue
        : simulation.result.objectiveValue - simulation.optimal.objectiveValue;
    const matched = gap === 0;
    return `
      <div class="proof-grid">
        <article class="proof-card warning">
          <h3>${t("proof_not_optimal_title")}</h3>
          <p>${t("proof_not_optimal_body")}</p>
          <p>${matched ? t("proof_matched_instance") : t("proof_gap_instance", { gap: formatValue(gap) })}</p>
        </article>
        <article class="proof-card">
          <h3>${t("proof_benchmark_title")}</h3>
          <p>${t("proof_benchmark_body", { best: formatValue(simulation.optimal.objectiveValue), found: formatValue(simulation.result.objectiveValue) })}</p>
        </article>
      </div>
    `;
  }

  if (problemId === "intervalScheduling") {
    return `
      <div class="proof-grid">
        <article class="proof-card">
          <h3>${t("proof_stays_ahead_title")}</h3>
          <p>${t("proof_stays_ahead_body")}</p>
          <div class="proof-table">
            <table>
              <thead>
                <tr>
                  <th>r</th>
                  <th>${t("proof_greedy_finish")}</th>
                  <th>${t("proof_optimal_finish")}</th>
                  <th>${t("proof_holds")}</th>
                </tr>
              </thead>
              <tbody>
                ${
                  simulation.proof.frontierComparison
                    .map(
                      (row) => `
                        <tr>
                          <td>${row.rank}</td>
                          <td>${escapeHtml(row.greedyId)} (${row.greedyFinish})</td>
                          <td>${escapeHtml(row.optimalId)} (${formatValue(row.optimalFinish)})</td>
                          <td>${row.staysAhead ? "✓" : "✗"}</td>
                        </tr>
                      `,
                    )
                    .join("") || `<tr><td colspan="4">${t("proof_no_rows")}</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </article>
        <article class="proof-card">
          <h3>${t("proof_conclusion_title")}</h3>
          <p>${t("proof_sched_conclusion", { greedy: simulation.result.objectiveValue, optimal: simulation.optimal.objectiveValue })}</p>
          <p>${t("proof_sched_selected", { ids: simulation.result.selectedIds.join(", ") || "∅" })}</p>
        </article>
      </div>
    `;
  }

  if (problemId === "intervalPartitioning") {
    return `
      <div class="proof-grid">
        <article class="proof-card">
          <h3>${t("proof_structural_bound_title")}</h3>
          <p>${t("proof_structural_bound_body")}</p>
          <p>${t("proof_depth_sentence", { depth: simulation.proof.depth, time: formatValue(simulation.proof.witnessTime) })}</p>
          <div class="pill-row">
            ${simulation.proof.witnessIds.map((id) => `<span class="pill warning">${escapeHtml(id)}</span>`).join("")}
          </div>
        </article>
        <article class="proof-card">
          <h3>${t("proof_conclusion_title")}</h3>
          <p>${t("proof_partition_conclusion", { used: simulation.result.objectiveValue, depth: simulation.proof.depth })}</p>
          <p>${t("proof_partition_rooms")}</p>
        </article>
      </div>
    `;
  }

  return `
    <div class="proof-grid">
      <article class="proof-card">
        <h3>${t("proof_exchange_argument_title")}</h3>
        <p>${t("proof_exchange_argument_body")}</p>
        <p>${t("proof_deadline_order", { order: simulation.proof.deadlineOrderIds.join(", ") })}</p>
        <p>${t("proof_schedule_order", { order: simulation.proof.scheduleOrderIds.join(", ") })}</p>
      </article>
      <article class="proof-card">
        <h3>${t("proof_conclusion_title")}</h3>
        <p>${t("proof_lateness_conclusion", { inversions: simulation.proof.inversions, lateness: simulation.result.objectiveValue })}</p>
        <p>${t("proof_lateness_swap")}</p>
      </article>
    </div>
  `;
}

export function renderSummaryCards(problem, algorithm, preset, simulation, t) {
  const optimalGap = getNormalizedGap(problem, simulation);
  const sourceLabel = preset ? t(preset.sourceKey) : t("source_generated");
  return `
    <article class="summary-card">
      <span>${t("card_objective")}</span>
      <strong>${t(problem.objectiveKey)}</strong>
      <small>${sourceLabel}</small>
    </article>
    <article class="summary-card">
      <span>${t("card_rule")}</span>
      <strong>${t(algorithm.labelKey)}</strong>
      <small>${t(algorithm.ruleKey)}</small>
    </article>
    <article class="summary-card">
      <span>${t("card_result")}</span>
      <strong>${t("card_result_value", { value: formatValue(simulation.result.objectiveValue) })}</strong>
      <small>${t("card_optimal_value", { value: formatValue(simulation.optimal.objectiveValue) })}</small>
    </article>
    <article class="summary-card">
      <span>${t("card_guarantee")}</span>
      <strong>${algorithm.optimal ? t("guarantee_optimal") : t("guarantee_heuristic")}</strong>
      <small>${optimalGap === 0 ? t("guarantee_matches") : t("guarantee_gap", { gap: formatValue(optimalGap) })}</small>
    </article>
    <article class="summary-card">
      <span>${t("card_complexity")}</span>
      <strong>${escapeHtml(algorithm.complexity)}</strong>
      <small>${t(algorithm.proofStyleKey)}</small>
    </article>
  `;
}

export function renderStateSummary(problemId, simulation, step, t) {
  const current = step.state.currentId ? escapeHtml(step.state.currentId) : t("state_none");
  let items = `
    <div class="state-row"><span>${t("state_current_item")}</span><strong>${current}</strong></div>
    <div class="state-row"><span>${t("state_step_message")}</span><strong>${t(step.messageKey, step.params)}</strong></div>
  `;

  if (problemId === "intervalScheduling") {
    const thirdLabel = simulation.algorithmId === "fewest-conflicts" ? t("state_considered") : t("state_last_finish");
    const thirdValue = simulation.algorithmId === "fewest-conflicts"
      ? step.state.processedIds?.length ?? 0
      : formatValue(step.state.lastFinish);
    items += `
      <div class="state-row"><span>${t("state_selected")}</span><strong>${step.state.selectedIds?.length ?? 0}</strong></div>
      <div class="state-row"><span>${t("state_rejected")}</span><strong>${step.state.rejectedIds?.length ?? 0}</strong></div>
      <div class="state-row"><span>${thirdLabel}</span><strong>${thirdValue}</strong></div>
    `;
  } else if (problemId === "intervalPartitioning") {
    items += `
      <div class="state-row"><span>${t("state_rooms_open")}</span><strong>${step.state.rooms?.length ?? 0}</strong></div>
      <div class="state-row"><span>${t("state_assigned")}</span><strong>${step.state.assignedIds?.length ?? 0}</strong></div>
      <div class="state-row"><span>${t("state_depth_bound")}</span><strong>${simulation.optimal.objectiveValue}</strong></div>
    `;
  } else {
    items += `
      <div class="state-row"><span>${t("state_time")}</span><strong>${formatValue(step.state.time)}</strong></div>
      <div class="state-row"><span>${t("state_scheduled_jobs")}</span><strong>${step.state.scheduled?.length ?? 0}</strong></div>
      <div class="state-row"><span>${t("state_max_lateness")}</span><strong>${formatValue(step.state.maxLateness)}</strong></div>
    `;
  }

  return items;
}

export function renderInstanceTable(problemId, simulation, step, t) {
  const roomAssignments = getRoomAssignmentMap(step.state.rooms);
  const displayItems = getDisplayItems(simulation, step.state);
  if (problemId === "minimizeLateness") {
    const scheduledMap = new Map((step.state.scheduled ?? []).map((item) => [item.id, item]));
    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>${t("header_job")}</th>
            <th>${t("header_duration")}</th>
            <th>${t("header_deadline")}</th>
            <th>${t("header_slack")}</th>
            <th>${t("header_completion")}</th>
            <th>${t("header_lateness")}</th>
            <th>${t("header_status")}</th>
          </tr>
        </thead>
        <tbody>
          ${displayItems
            .map((item) => {
              const scheduled = scheduledMap.get(item.id);
              const status = getStatusForItem(problemId, item.id, step.state);
              return `
                <tr class="status-${status}">
                  <td>${escapeHtml(item.id)}</td>
                  <td>${item.duration}</td>
                  <td>${item.deadline}</td>
                  <td>${item.slack}</td>
                  <td>${scheduled ? `[${scheduled.start}, ${scheduled.finish}]` : "—"}</td>
                  <td>${scheduled ? scheduled.lateness : "—"}</td>
                  <td>${t(getStatusLabelKey(status))}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>${t("header_id")}</th>
          <th>${t("header_start")}</th>
          <th>${t("header_finish")}</th>
          <th>${t("header_length")}</th>
          <th>${t("header_conflicts")}</th>
          ${problemId === "intervalPartitioning" ? `<th>${t("header_room")}</th>` : ""}
          <th>${t("header_status")}</th>
        </tr>
      </thead>
      <tbody>
        ${displayItems
          .map((item) => {
            const status = getStatusForItem(problemId, item.id, step.state);
            return `
              <tr class="status-${status}">
                <td>${escapeHtml(item.id)}</td>
                <td>${item.start}</td>
                <td>${item.finish}</td>
                <td>${item.duration}</td>
                <td>${item.conflicts}</td>
                ${problemId === "intervalPartitioning" ? `<td>${formatValue(roomAssignments.get(item.id))}</td>` : ""}
                <td>${t(getStatusLabelKey(status))}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

export function renderStepLog(steps, currentIndex, t) {
  const startIndex = Math.max(0, currentIndex - 7);
  return `
    <ol class="log-list">
      ${steps
        .slice(startIndex, currentIndex + 1)
        .map(
          (step) => `
            <li class="${step.index === currentIndex ? "active" : ""}">
              <span class="log-step">${step.index + 1}</span>
              <div>
                <strong>${t(step.messageKey, step.params)}</strong>
                <small>${step.line ? t("log_line_label", { line: step.line }) : t("log_line_label_none")}</small>
              </div>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

export function renderView(viewMode, problemId, algorithm, simulation, step, t, boardState) {
  if (viewMode === "code") {
    return renderCodeView(problemId, algorithm, simulation, step, t);
  }
  if (viewMode === "interval") {
    return renderIntervalView(problemId, simulation, step, t, boardState);
  }
  if (viewMode === "graph") {
    return renderConflictGraph(problemId, simulation, step, t, boardState);
  }
  return renderProofView(problemId, algorithm, simulation, step, t);
}
