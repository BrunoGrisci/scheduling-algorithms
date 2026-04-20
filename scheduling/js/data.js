export const STORAGE_KEYS = {
  language: "scheduling-algorithms-language",
  theme: "scheduling-algorithms-theme",
};

export const LANGUAGES = ["en", "pt-BR"];
export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8, 10];
export const VIEW_MODES = ["code", "interval", "graph", "proof"];

function interval(id, start, finish) {
  return { id, start, finish };
}

function job(id, duration, deadline) {
  return { id, duration, deadline };
}

export const PROBLEMS = {
  intervalScheduling: {
    id: "intervalScheduling",
    labelKey: "problem_interval_scheduling",
    subtitleKey: "problem_interval_scheduling_subtitle",
    objectiveKey: "objective_interval_scheduling",
    goal: "maximize",
    csvColumns: ["id", "start", "finish"],
  },
  intervalPartitioning: {
    id: "intervalPartitioning",
    labelKey: "problem_interval_partitioning",
    subtitleKey: "problem_interval_partitioning_subtitle",
    objectiveKey: "objective_interval_partitioning",
    goal: "minimize",
    csvColumns: ["id", "start", "finish"],
  },
  minimizeLateness: {
    id: "minimizeLateness",
    labelKey: "problem_minimize_lateness",
    subtitleKey: "problem_minimize_lateness_subtitle",
    objectiveKey: "objective_minimize_lateness",
    goal: "minimize",
    csvColumns: ["job", "length", "deadline"],
  },
};

export const ALGORITHMS = {
  intervalScheduling: [
    {
      id: "earliest-start",
      labelKey: "algo_earliest_start",
      ruleKey: "rule_earliest_start",
      complexity: "O(n log n)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_start",
    },
    {
      id: "shortest-interval",
      labelKey: "algo_shortest_interval",
      ruleKey: "rule_shortest_interval",
      complexity: "O(n log n)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_length",
    },
    {
      id: "fewest-conflicts",
      labelKey: "algo_fewest_conflicts",
      ruleKey: "rule_fewest_conflicts",
      complexity: "O(n^2)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_conflicts",
    },
    {
      id: "earliest-finish",
      labelKey: "algo_earliest_finish",
      ruleKey: "rule_earliest_finish",
      complexity: "O(n log n)",
      optimal: true,
      proofStyleKey: "proof_stays_ahead",
      comparatorKey: "comparator_finish",
    },
  ],
  intervalPartitioning: [
    {
      id: "earliest-start",
      labelKey: "algo_earliest_start",
      ruleKey: "rule_earliest_start",
      complexity: "O(n log n)",
      optimal: true,
      proofStyleKey: "proof_structural_bound",
      comparatorKey: "comparator_start",
    },
    {
      id: "shortest-interval",
      labelKey: "algo_shortest_interval",
      ruleKey: "rule_shortest_interval",
      complexity: "O(n log n)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_length",
    },
    {
      id: "fewest-conflicts",
      labelKey: "algo_fewest_conflicts",
      ruleKey: "rule_fewest_conflicts",
      complexity: "O(n^2)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_conflicts",
    },
    {
      id: "earliest-finish",
      labelKey: "algo_earliest_finish",
      ruleKey: "rule_earliest_finish",
      complexity: "O(n log n)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_finish",
    },
  ],
  minimizeLateness: [
    {
      id: "shortest-duration",
      labelKey: "algo_shortest_duration",
      ruleKey: "rule_shortest_duration",
      complexity: "O(n log n)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_duration",
    },
    {
      id: "smallest-slack",
      labelKey: "algo_smallest_slack",
      ruleKey: "rule_smallest_slack",
      complexity: "O(n log n)",
      optimal: false,
      proofStyleKey: "proof_none",
      comparatorKey: "comparator_slack",
    },
    {
      id: "earliest-deadline",
      labelKey: "algo_earliest_deadline",
      ruleKey: "rule_earliest_deadline",
      complexity: "O(n log n)",
      optimal: true,
      proofStyleKey: "proof_exchange_argument",
      comparatorKey: "comparator_deadline",
    },
  ],
};

export const PRESETS = {
  intervalScheduling: [
    {
      id: "refs-earliest-start-fails",
      labelKey: "preset_sched_refs_a",
      descriptionKey: "preset_sched_refs_a_desc",
      sourceKey: "source_refs_intervalos_py",
      items: [
        interval("A", 0, 9),
        interval("B", 1, 2),
        interval("C", 3, 4),
        interval("D", 5, 6),
        interval("E", 7, 8),
      ],
    },
    {
      id: "refs-shortest-interval-fails",
      labelKey: "preset_sched_refs_b",
      descriptionKey: "preset_sched_refs_b_desc",
      sourceKey: "source_refs_intervalos_py",
      items: [
        interval("A", 0, 5),
        interval("B", 6, 10),
        interval("C", 4, 7),
      ],
    },
    {
      id: "refs-fewest-conflicts-fails",
      labelKey: "preset_sched_refs_c",
      descriptionKey: "preset_sched_refs_c_desc",
      sourceKey: "source_refs_intervalos_py",
      items: [
        interval("A", 0, 2),
        interval("B", 1, 4),
        interval("C", 1, 4),
        interval("D", 1, 4),
        interval("E", 3, 6),
        interval("F", 5, 8),
        interval("G", 7, 10),
        interval("H", 9, 12),
        interval("I", 9, 12),
        interval("J", 9, 12),
        interval("K", 11, 14),
      ],
    },
  ],
  intervalPartitioning: [
    {
      id: "refs-main-example",
      labelKey: "preset_part_refs_d",
      descriptionKey: "preset_part_refs_d_desc",
      sourceKey: "source_refs_intervalos_py",
      items: [
        interval("A", 0, 11),
        interval("B", 0, 1),
        interval("C", 2, 5),
        interval("D", 7, 10),
        interval("E", 0, 3),
        interval("F", 4, 6),
        interval("G", 8, 12),
        interval("H", 13, 16),
        interval("I", 14, 15),
      ],
    },
    {
      id: "counterexample-earliest-finish",
      labelKey: "preset_part_finish_fail",
      descriptionKey: "preset_part_finish_fail_desc",
      sourceKey: "source_curated",
      items: [
        interval("A", 0, 1),
        interval("B", 0, 2),
        interval("C", 1, 4),
        interval("D", 2, 3),
      ],
    },
    {
      id: "counterexample-shortest-interval",
      labelKey: "preset_part_shortest_fail",
      descriptionKey: "preset_part_shortest_fail_desc",
      sourceKey: "source_curated",
      items: [
        interval("A", 0, 1),
        interval("B", 0, 2),
        interval("C", 1, 3),
        interval("D", 2, 3),
      ],
    },
    {
      id: "counterexample-fewest-conflicts",
      labelKey: "preset_part_conflicts_fail",
      descriptionKey: "preset_part_conflicts_fail_desc",
      sourceKey: "source_curated",
      items: [
        interval("A", 0, 1),
        interval("B", 0, 2),
        interval("C", 0, 3),
        interval("D", 2, 3),
      ],
    },
  ],
  minimizeLateness: [
    {
      id: "refs-python-example",
      labelKey: "preset_late_refs_python",
      descriptionKey: "preset_late_refs_python_desc",
      sourceKey: "source_refs_intervalos_py",
      items: [
        job("a", 3, 6),
        job("b", 2, 8),
        job("c", 1, 9),
        job("d", 4, 9),
        job("e", 3, 14),
        job("f", 2, 15),
      ],
    },
    {
      id: "refs-slide-instance-1",
      labelKey: "preset_late_slide_1",
      descriptionKey: "preset_late_slide_1_desc",
      sourceKey: "source_refs_aulas_tex",
      items: [job("a", 1, 3), job("b", 2, 2), job("c", 6, 7)],
    },
    {
      id: "refs-slide-instance-2",
      labelKey: "preset_late_slide_2",
      descriptionKey: "preset_late_slide_2_desc",
      sourceKey: "source_refs_aulas_tex",
      items: [job("a", 4, 10), job("b", 5, 6), job("c", 3, 9)],
    },
  ],
};

export function getAlgorithms(problemId) {
  return ALGORITHMS[problemId] ?? [];
}

export function getAlgorithm(problemId, algorithmId) {
  return getAlgorithms(problemId).find((algorithm) => algorithm.id === algorithmId);
}

export function getPresets(problemId) {
  return PRESETS[problemId] ?? [];
}

export function getPreset(problemId, presetId) {
  return getPresets(problemId).find((preset) => preset.id === presetId);
}

export function getDefaultPresetId(problemId) {
  return getPresets(problemId)[0]?.id ?? "";
}

function makeIdentifier(index, uppercase = true) {
  const alphabet = uppercase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";
  if (index < alphabet.length) {
    return alphabet[index];
  }
  const prefix = uppercase ? "I" : "j";
  return `${prefix}${index + 1}`;
}

export function clampRandomSize(value) {
  if (!Number.isFinite(value)) {
    return 8;
  }
  return Math.min(18, Math.max(3, Math.round(value)));
}

export function buildRandomInstance(problemId, size) {
  const finalSize = clampRandomSize(size);
  if (problemId === "minimizeLateness") {
    const items = [];
    let accumulated = 0;
    for (let index = 0; index < finalSize; index += 1) {
      const duration = 1 + Math.floor(Math.random() * 5);
      const slack = Math.floor(Math.random() * 8);
      accumulated += duration;
      items.push(job(makeIdentifier(index, false), duration, accumulated + slack));
    }
    return items;
  }

  const items = [];
  for (let index = 0; index < finalSize; index += 1) {
    const start = Math.floor(Math.random() * Math.max(6, finalSize + 4));
    const finish = start + 1 + Math.floor(Math.random() * 6);
    items.push(interval(makeIdentifier(index), start, finish));
  }
  return items;
}

export function parseCsvText(problemId, csvText) {
  const rows = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));

  if (rows.length === 0) {
    throw new Error("empty_csv");
  }

  const header = rows[0].map((cell) => cell.toLowerCase());
  const expectsJobHeader = problemId === "minimizeLateness";
  const hasHeader =
    (expectsJobHeader && header.join(",") === "job,length,deadline") ||
    (!expectsJobHeader && header.join(",") === "id,start,finish");

  const dataRows = hasHeader ? rows.slice(1) : rows;
  if (dataRows.length === 0) {
    throw new Error("empty_csv");
  }

  return dataRows.map((cells, index) => {
    if (cells.length !== 3) {
      throw new Error("invalid_csv_columns");
    }

    const [rawId, rawA, rawB] = cells;
    const id = rawId || makeIdentifier(index, problemId !== "minimizeLateness");

    if (problemId === "minimizeLateness") {
      const duration = Number(rawA);
      const deadline = Number(rawB);
      if (!Number.isFinite(duration) || !Number.isFinite(deadline) || duration <= 0) {
        throw new Error("invalid_csv_numbers");
      }
      return job(id, duration, deadline);
    }

    const start = Number(rawA);
    const finish = Number(rawB);
    if (!Number.isFinite(start) || !Number.isFinite(finish) || finish <= start) {
      throw new Error("invalid_csv_numbers");
    }
    return interval(id, start, finish);
  });
}
