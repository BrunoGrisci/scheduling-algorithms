import assert from "node:assert/strict";

import { simulateProblem } from "../scheduling/js/algorithms.js";
import { PRESETS, parseCsvText } from "../scheduling/js/data.js";

const schedStartFail = simulateProblem(
  "intervalScheduling",
  "earliest-start",
  PRESETS.intervalScheduling[0].items,
);
assert.equal(schedStartFail.result.objectiveValue, 1);
assert.equal(schedStartFail.optimal.objectiveValue, 4);

const schedOptimal = simulateProblem(
  "intervalScheduling",
  "earliest-finish",
  PRESETS.intervalScheduling[0].items,
);
assert.equal(schedOptimal.result.objectiveValue, 4);
assert.deepEqual(schedOptimal.result.selectedIds, ["B", "C", "D", "E"]);

const schedConflictCount = simulateProblem(
  "intervalScheduling",
  "fewest-conflicts",
  PRESETS.intervalScheduling[0].items,
);
assert.ok(schedConflictCount.operationTotal > schedOptimal.operationTotal);

const schedShortFail = simulateProblem(
  "intervalScheduling",
  "shortest-interval",
  PRESETS.intervalScheduling[1].items,
);
assert.equal(schedShortFail.result.objectiveValue, 1);
assert.equal(schedShortFail.optimal.objectiveValue, 2);

const schedShortEarlierCompat = simulateProblem(
  "intervalScheduling",
  "shortest-interval",
  [
    { id: "A", start: 8, finish: 11 },
    { id: "B", start: 8, finish: 12 },
    { id: "C", start: 6, finish: 10 },
    { id: "D", start: 2, finish: 6 },
    { id: "E", start: 7, finish: 8 },
  ],
);
assert.equal(schedShortEarlierCompat.result.objectiveValue, 3);
assert.deepEqual(schedShortEarlierCompat.result.selectedIds, ["D", "E", "A"]);
assert.equal(schedShortEarlierCompat.optimal.objectiveValue, 3);

const schedConflictFail = simulateProblem(
  "intervalScheduling",
  "fewest-conflicts",
  PRESETS.intervalScheduling[2].items,
);
assert.equal(schedConflictFail.result.objectiveValue, 3);
assert.equal(schedConflictFail.optimal.objectiveValue, 4);
assert.deepEqual(schedConflictFail.result.selectedIds, ["A", "F", "K"]);

const partitionOptimal = simulateProblem(
  "intervalPartitioning",
  "earliest-start",
  PRESETS.intervalPartitioning[0].items,
);
assert.equal(partitionOptimal.result.objectiveValue, 3);
assert.equal(partitionOptimal.optimal.objectiveValue, 3);

const partitionFinishFail = simulateProblem(
  "intervalPartitioning",
  "earliest-finish",
  PRESETS.intervalPartitioning[1].items,
);
assert.equal(partitionFinishFail.result.objectiveValue, 3);
assert.equal(partitionFinishFail.optimal.objectiveValue, 2);

const partitionShortestFail = simulateProblem(
  "intervalPartitioning",
  "shortest-interval",
  PRESETS.intervalPartitioning[2].items,
);
assert.equal(partitionShortestFail.result.objectiveValue, 3);
assert.equal(partitionShortestFail.optimal.objectiveValue, 2);

const partitionShortestEarlierCompat = simulateProblem(
  "intervalPartitioning",
  "shortest-interval",
  [
    { id: "A", start: 10, finish: 11 },
    { id: "B", start: 0, finish: 5 },
    { id: "C", start: 6, finish: 7 },
  ],
);
assert.equal(partitionShortestEarlierCompat.result.objectiveValue, 1);
assert.equal(partitionShortestEarlierCompat.optimal.objectiveValue, 1);

const partitionConflictFail = simulateProblem(
  "intervalPartitioning",
  "fewest-conflicts",
  PRESETS.intervalPartitioning[3].items,
);
assert.equal(partitionConflictFail.result.objectiveValue, 4);
assert.equal(partitionConflictFail.optimal.objectiveValue, 3);

const latenessShortest = simulateProblem(
  "minimizeLateness",
  "shortest-duration",
  PRESETS.minimizeLateness[1].items,
);
assert.equal(latenessShortest.result.objectiveValue, 2);

const latenessSlackFail = simulateProblem(
  "minimizeLateness",
  "smallest-slack",
  PRESETS.minimizeLateness[1].items,
);
assert.equal(latenessSlackFail.result.objectiveValue, 6);
assert.equal(latenessSlackFail.optimal.objectiveValue, 2);

const latenessOptimal = simulateProblem(
  "minimizeLateness",
  "earliest-deadline",
  PRESETS.minimizeLateness[1].items,
);
assert.equal(latenessOptimal.result.objectiveValue, 2);
assert.deepEqual(
  latenessOptimal.result.schedule.map((job) => job.id),
  ["b", "a", "c"],
);

const optimalCachingBelady = simulateProblem(
  "optimalCaching",
  "farthest-future",
  PRESETS.optimalCaching[0].items,
);
assert.equal(optimalCachingBelady.result.objectiveValue, 4);
assert.equal(optimalCachingBelady.optimal.objectiveValue, 4);

const optimalCachingLru = simulateProblem(
  "optimalCaching",
  "least-recently-used",
  PRESETS.optimalCaching[0].items,
);
assert.equal(optimalCachingLru.result.objectiveValue, 5);
assert.equal(optimalCachingLru.optimal.objectiveValue, 4);

const realCachingLru = simulateProblem(
  "realCaching",
  "least-recently-used",
  PRESETS.realCaching[1].items,
);
assert.equal(realCachingLru.result.objectiveValue, 7);
assert.equal(realCachingLru.optimal.objectiveValue, 7);

const realCachingRandom = simulateProblem(
  "realCaching",
  "random-eviction",
  PRESETS.realCaching[1].items,
);
assert.equal(realCachingRandom.result.objectiveValue, 8);
assert.equal(realCachingRandom.optimal.objectiveValue, 7);

const parsedIntervals = parseCsvText("intervalScheduling", "id,start,finish\nx,0,3\ny,3,4");
assert.deepEqual(parsedIntervals, [
  { id: "x", start: 0, finish: 3 },
  { id: "y", start: 3, finish: 4 },
]);

const parsedJobs = parseCsvText("minimizeLateness", "job,length,deadline\na,3,7\nb,2,5");
assert.deepEqual(parsedJobs, [
  { id: "a", duration: 3, deadline: 7 },
  { id: "b", duration: 2, deadline: 5 },
]);

const parsedCache = parseCsvText("optimalCaching", "n_elements,cache_size,queue\n5,3,A B C D A D E");
assert.deepEqual(parsedCache, {
  universeSize: 5,
  cacheSize: 3,
  requests: ["A", "B", "C", "D", "A", "D", "E"],
});

console.log("All algorithm checks passed.");
