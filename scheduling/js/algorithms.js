function numericIdCompare(a, b) {
  return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: "base" });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function addOperations(metrics, amount = 1) {
  if (metrics) {
    metrics.operations += amount;
  }
}

export function intervalsOverlap(first, second) {
  return first.start < second.finish && second.start < first.finish;
}

function decorateIntervals(items, metrics = null) {
  const decorated = items.map((item) => ({
    ...item,
    duration: item.finish - item.start,
    conflicts: 0,
  }));

  for (let left = 0; left < decorated.length; left += 1) {
    for (let right = left + 1; right < decorated.length; right += 1) {
      addOperations(metrics);
      if (intervalsOverlap(decorated[left], decorated[right])) {
        decorated[left].conflicts += 1;
        decorated[right].conflicts += 1;
      }
    }
  }

  return decorated;
}

function decorateJobs(items) {
  return items.map((item) => ({
    ...item,
    slack: item.deadline - item.duration,
  }));
}

function getIntervalComparator(algorithmId) {
  if (algorithmId === "earliest-start") {
    return (a, b) => a.start - b.start || a.finish - b.finish || numericIdCompare(a, b);
  }
  if (algorithmId === "shortest-interval") {
    return (a, b) => a.duration - b.duration || a.start - b.start || a.finish - b.finish || numericIdCompare(a, b);
  }
  if (algorithmId === "fewest-conflicts") {
    return (a, b) => a.conflicts - b.conflicts || a.start - b.start || a.finish - b.finish || numericIdCompare(a, b);
  }
  return (a, b) => a.finish - b.finish || a.start - b.start || numericIdCompare(a, b);
}

function sortIntervalsChronologically(items) {
  return [...items].sort((a, b) => a.start - b.start || a.finish - b.finish || numericIdCompare(a, b));
}

function getChronologicalSelectionIds(selectedItems) {
  return sortIntervalsChronologically(selectedItems).map((item) => item.id);
}

function isCompatibleWithSelection(item, selectedItems, algorithmId, metrics = null) {
  if (selectedItems.length === 0) {
    addOperations(metrics);
    return true;
  }

  if (algorithmId === "fewest-conflicts") {
    for (const selectedItem of selectedItems) {
      addOperations(metrics);
      if (intervalsOverlap(selectedItem, item)) {
        return false;
      }
    }
    return true;
  }

  addOperations(metrics);
  return selectedItems[selectedItems.length - 1].finish <= item.start;
}

function getLatenessComparator(algorithmId) {
  if (algorithmId === "shortest-duration") {
    return (a, b) => a.duration - b.duration || a.deadline - b.deadline || numericIdCompare(a, b);
  }
  if (algorithmId === "smallest-slack") {
    return (a, b) => a.slack - b.slack || a.deadline - b.deadline || a.duration - b.duration || numericIdCompare(a, b);
  }
  return (a, b) => a.deadline - b.deadline || a.duration - b.duration || numericIdCompare(a, b);
}

function mergeSortWithMetrics(items, compare, metrics = null) {
  if (items.length <= 1) {
    return [...items];
  }

  const middle = Math.floor(items.length / 2);
  const left = mergeSortWithMetrics(items.slice(0, middle), compare, metrics);
  const right = mergeSortWithMetrics(items.slice(middle), compare, metrics);
  const merged = [];

  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    addOperations(metrics);
    if (compare(left[leftIndex], right[rightIndex]) <= 0) {
      merged.push(left[leftIndex]);
      leftIndex += 1;
    } else {
      merged.push(right[rightIndex]);
      rightIndex += 1;
    }
  }

  while (leftIndex < left.length) {
    merged.push(left[leftIndex]);
    leftIndex += 1;
  }
  while (rightIndex < right.length) {
    merged.push(right[rightIndex]);
    rightIndex += 1;
  }

  return merged;
}

class MinHeap {
  constructor(compare) {
    this.compare = compare;
    this.values = [];
  }

  peek() {
    return this.values[0];
  }

  push(value) {
    this.values.push(value);
    this.#bubbleUp(this.values.length - 1);
  }

  pop() {
    if (this.values.length === 0) {
      return null;
    }
    const top = this.values[0];
    const last = this.values.pop();
    if (this.values.length > 0 && last) {
      this.values[0] = last;
      this.#bubbleDown(0);
    }
    return top;
  }

  #bubbleUp(index) {
    let currentIndex = index;
    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      if (this.compare(this.values[currentIndex], this.values[parentIndex]) >= 0) {
        break;
      }
      [this.values[currentIndex], this.values[parentIndex]] = [this.values[parentIndex], this.values[currentIndex]];
      currentIndex = parentIndex;
    }
  }

  #bubbleDown(index) {
    let currentIndex = index;
    while (true) {
      const leftIndex = currentIndex * 2 + 1;
      const rightIndex = currentIndex * 2 + 2;
      let smallestIndex = currentIndex;

      if (leftIndex < this.values.length && this.compare(this.values[leftIndex], this.values[smallestIndex]) < 0) {
        smallestIndex = leftIndex;
      }
      if (rightIndex < this.values.length && this.compare(this.values[rightIndex], this.values[smallestIndex]) < 0) {
        smallestIndex = rightIndex;
      }
      if (smallestIndex === currentIndex) {
        break;
      }
      [this.values[currentIndex], this.values[smallestIndex]] = [this.values[smallestIndex], this.values[currentIndex]];
      currentIndex = smallestIndex;
    }
  }
}

function makeStep(index, line, messageKey, params, state, operationCount = 0) {
  return {
    index,
    line,
    messageKey,
    params,
    state: clone(state),
    operationCount,
  };
}

function computeIntervalSchedulingOptimal(items) {
  const sorted = [...decorateIntervals(items)].sort((a, b) => a.finish - b.finish || a.start - b.start || numericIdCompare(a, b));
  const previousCompatible = sorted.map((item, index) => {
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (sorted[cursor].finish <= item.start) {
        return cursor;
      }
    }
    return -1;
  });

  const best = new Array(sorted.length).fill(0);
  for (let index = 0; index < sorted.length; index += 1) {
    const withCurrent = 1 + (previousCompatible[index] >= 0 ? best[previousCompatible[index]] : 0);
    const withoutCurrent = index > 0 ? best[index - 1] : 0;
    best[index] = Math.max(withCurrent, withoutCurrent);
  }

  const selection = [];
  let cursor = sorted.length - 1;
  while (cursor >= 0) {
    const withCurrent = 1 + (previousCompatible[cursor] >= 0 ? best[previousCompatible[cursor]] : 0);
    const withoutCurrent = cursor > 0 ? best[cursor - 1] : 0;
    if (withCurrent >= withoutCurrent) {
      selection.push(sorted[cursor]);
      cursor = previousCompatible[cursor];
    } else {
      cursor -= 1;
    }
  }

  selection.reverse();
  return {
    count: selection.length,
    selectedIds: selection.map((item) => item.id),
    selected: selection,
  };
}

function computeDepthWithWitness(items) {
  const events = [];
  for (const item of items) {
    events.push({ time: item.start, delta: 1, kind: "start", item });
    events.push({ time: item.finish, delta: -1, kind: "finish", item });
  }

  events.sort((a, b) => a.time - b.time || a.delta - b.delta);

  let current = 0;
  let bestDepth = 0;
  let witnessTime = items[0]?.start ?? 0;
  for (const event of events) {
    current += event.delta;
    if (current > bestDepth) {
      bestDepth = current;
      witnessTime = event.time + 0.0001;
    }
  }

  const witnessIds = items.filter((item) => item.start < witnessTime && witnessTime < item.finish).map((item) => item.id);
  return {
    depth: bestDepth,
    witnessTime,
    witnessIds,
  };
}

function countInversionsByDeadline(schedule) {
  let inversions = 0;
  const pairs = [];
  for (let left = 0; left < schedule.length; left += 1) {
    for (let right = left + 1; right < schedule.length; right += 1) {
      if (schedule[left].deadline > schedule[right].deadline) {
        inversions += 1;
        pairs.push([schedule[left].id, schedule[right].id]);
      }
    }
  }
  return { inversions, pairs };
}

function simulateIntervalScheduling(items, algorithmId) {
  const metrics = { operations: 0 };
  const optimal = computeIntervalSchedulingOptimal(items);

  const state = {
    selectedIds: [],
    rejectedIds: [],
    processedIds: [],
    decisions: [],
    currentId: null,
    currentIndex: null,
    lastFinish: null,
    objectiveValue: 0,
    isSorted: false,
  };

  const steps = [];
  let stepIndex = 0;
  steps.push(makeStep(stepIndex++, null, "step_ready", {}, state, metrics.operations));
  const decorated = decorateIntervals(items, algorithmId === "fewest-conflicts" ? metrics : null);
  const sortedItems = mergeSortWithMetrics(decorated, getIntervalComparator(algorithmId), metrics);
  state.isSorted = true;
  steps.push(
    makeStep(stepIndex++, 1, "step_sorted", { count: sortedItems.length }, {
      ...state,
      sortedIds: sortedItems.map((item) => item.id),
    }, metrics.operations),
  );
  addOperations(metrics);
  steps.push(makeStep(stepIndex++, 2, "step_initialized", {}, state, metrics.operations));

  const selectedItems = [];
  for (let index = 0; index < sortedItems.length; index += 1) {
    const item = sortedItems[index];
    state.currentId = item.id;
    state.currentIndex = index;
    addOperations(metrics);
    steps.push(makeStep(stepIndex++, 3, "step_consider_interval", { id: item.id }, state, metrics.operations));

    const compatible = isCompatibleWithSelection(item, selectedItems, algorithmId, metrics);
    state.processedIds.push(item.id);
    if (compatible) {
      selectedItems.push(item);
      if (algorithmId === "fewest-conflicts") {
        state.selectedIds = getChronologicalSelectionIds(selectedItems);
        state.lastFinish = null;
      } else {
        state.selectedIds.push(item.id);
        state.lastFinish = item.finish;
      }
      addOperations(metrics);
      state.objectiveValue = state.selectedIds.length;
      state.decisions.push({
        id: item.id,
        decision: "selected",
        reasonKey: "reason_compatible",
      });
      steps.push(
        makeStep(
          stepIndex++,
          5,
          algorithmId === "fewest-conflicts" ? "step_select_interval_set" : "step_select_interval",
          algorithmId === "fewest-conflicts"
            ? { id: item.id, count: state.selectedIds.length }
            : { id: item.id, finish: item.finish },
          state,
          metrics.operations,
        ),
      );
    } else {
      state.rejectedIds.push(item.id);
      addOperations(metrics);
      state.decisions.push({
        id: item.id,
        decision: "rejected",
        reasonKey: "reason_incompatible",
      });
      steps.push(makeStep(stepIndex++, 6, "step_reject_interval", { id: item.id }, state, metrics.operations));
    }
  }

  state.currentId = null;
  state.currentIndex = null;
  steps.push(makeStep(stepIndex++, null, "step_finished", {}, state, metrics.operations));

  const displayedSelection = algorithmId === "fewest-conflicts" ? sortIntervalsChronologically(selectedItems) : selectedItems;
  const displayedSelectionIds = algorithmId === "fewest-conflicts" ? getChronologicalSelectionIds(selectedItems) : state.selectedIds;

  const frontierComparison = displayedSelectionIds.map((id, index) => {
    const greedyInterval = displayedSelection[index];
    const optimalInterval = optimal.selected[index] ?? null;
    return {
      rank: index + 1,
      greedyId: greedyInterval.id,
      greedyFinish: greedyInterval.finish,
      optimalId: optimalInterval?.id ?? "—",
      optimalFinish: optimalInterval?.finish ?? null,
      staysAhead: optimalInterval ? greedyInterval.finish <= optimalInterval.finish : true,
    };
  });

  return {
    problemId: "intervalScheduling",
    algorithmId,
    items: decorated,
    sortedItems,
    steps,
    operationTotal: metrics.operations,
    result: {
      selected: displayedSelection,
      selectedIds: displayedSelectionIds,
      rejectedIds: state.rejectedIds,
      objectiveValue: displayedSelection.length,
    },
    optimal: {
      objectiveValue: optimal.count,
      selectedIds: optimal.selectedIds,
    },
    proof: {
      style: "staysAhead",
      frontierComparison,
      greedyIds: displayedSelectionIds,
      optimalIds: optimal.selectedIds,
    },
  };
}

function runPartitioningCore(items, algorithmId, recordSteps) {
  const metrics = { operations: 0 };
  const roomHeap = new MinHeap((a, b) => {
    addOperations(metrics);
    return a.finish - b.finish || a.roomId - b.roomId;
  });
  const rooms = [];
  const state = {
    rooms: [],
    assignedIds: [],
    decisions: [],
    currentId: null,
    currentIndex: null,
    objectiveValue: 0,
    isSorted: false,
  };

  const steps = [];
  let stepIndex = 0;
  if (recordSteps) {
    steps.push(makeStep(stepIndex++, null, "step_ready", {}, state, metrics.operations));
  }
  const decorated = decorateIntervals(items, algorithmId === "fewest-conflicts" ? metrics : null);
  const sortedItems = mergeSortWithMetrics(decorated, getIntervalComparator(algorithmId), metrics);
  const depthInfo = computeDepthWithWitness(decorated);
  if (recordSteps) {
    state.isSorted = true;
    steps.push(
      makeStep(stepIndex++, 1, "step_sorted", { count: sortedItems.length }, {
        ...state,
        sortedIds: sortedItems.map((item) => item.id),
      }, metrics.operations),
    );
    addOperations(metrics);
    steps.push(makeStep(stepIndex++, 2, "step_initialized", {}, state, metrics.operations));
  }

  let nextRoomId = 1;
  for (let index = 0; index < sortedItems.length; index += 1) {
    const item = sortedItems[index];
    state.currentId = item.id;
    state.currentIndex = index;

    if (recordSteps) {
      addOperations(metrics);
      steps.push(makeStep(stepIndex++, 3, "step_consider_interval", { id: item.id }, state, metrics.operations));
    }

    const earliestRoom = roomHeap.peek();
    addOperations(metrics);
    if (earliestRoom && earliestRoom.finish <= item.start) {
      const room = roomHeap.pop();
      room.finish = item.finish;
      room.items.push(item);
      roomHeap.push(room);
      state.assignedIds.push(item.id);
      state.objectiveValue = rooms.length;
      state.decisions.push({
        id: item.id,
        roomId: room.roomId,
        decision: "reuse",
      });
      addOperations(metrics);
      state.rooms = rooms.map((currentRoom) => ({
        roomId: currentRoom.roomId,
        finish: currentRoom.finish,
        items: currentRoom.items,
      }));
      if (recordSteps) {
        steps.push(
          makeStep(stepIndex++, 5, "step_assign_existing_room", { id: item.id, roomId: room.roomId }, state, metrics.operations),
        );
      }
    } else {
      const room = {
        roomId: nextRoomId,
        finish: item.finish,
        items: [item],
      };
      nextRoomId += 1;
      rooms.push(room);
      roomHeap.push(room);
      state.assignedIds.push(item.id);
      state.objectiveValue = rooms.length;
      state.decisions.push({
        id: item.id,
        roomId: room.roomId,
        decision: "new-room",
      });
      addOperations(metrics);
      state.rooms = rooms.map((currentRoom) => ({
        roomId: currentRoom.roomId,
        finish: currentRoom.finish,
        items: currentRoom.items,
      }));
      if (recordSteps) {
        steps.push(makeStep(stepIndex++, 6, "step_open_room", { id: item.id, roomId: room.roomId }, state, metrics.operations));
      }
    }
  }

  if (recordSteps) {
    state.currentId = null;
    state.currentIndex = null;
    steps.push(makeStep(stepIndex++, null, "step_finished", {}, state, metrics.operations));
  }

  return {
    problemId: "intervalPartitioning",
    algorithmId,
    items: decorated,
    sortedItems,
    steps,
    operationTotal: metrics.operations,
    result: {
      rooms: rooms.map((room) => ({
        roomId: room.roomId,
        finish: room.finish,
        items: room.items,
      })),
      objectiveValue: rooms.length,
    },
    optimal: {
      objectiveValue: depthInfo.depth,
    },
    proof: {
      style: "structuralBound",
      depth: depthInfo.depth,
      witnessTime: depthInfo.witnessTime,
      witnessIds: depthInfo.witnessIds,
    },
  };
}

function simulatePartitioning(items, algorithmId) {
  return runPartitioningCore(items, algorithmId, true);
}

function runLatenessCore(items, algorithmId, recordSteps) {
  const metrics = { operations: 0 };
  const state = {
    scheduled: [],
    currentId: null,
    currentIndex: null,
    time: 0,
    maxLateness: 0,
    objectiveValue: 0,
    decisions: [],
    isSorted: false,
  };

  const steps = [];
  let stepIndex = 0;
  if (recordSteps) {
    steps.push(makeStep(stepIndex++, null, "step_ready", {}, state, metrics.operations));
  }
  const decorated = decorateJobs(items);
  const sortedItems = mergeSortWithMetrics(decorated, getLatenessComparator(algorithmId), metrics);
  if (recordSteps) {
    state.isSorted = true;
    steps.push(
      makeStep(stepIndex++, 1, "step_sorted", { count: sortedItems.length }, {
        ...state,
        sortedIds: sortedItems.map((item) => item.id),
      }, metrics.operations),
    );
    addOperations(metrics, 2);
    steps.push(makeStep(stepIndex++, 2, "step_initialized", {}, state, metrics.operations));
  }

  for (let index = 0; index < sortedItems.length; index += 1) {
    const item = sortedItems[index];
    state.currentId = item.id;
    state.currentIndex = index;
    if (recordSteps) {
      addOperations(metrics);
      steps.push(makeStep(stepIndex++, 3, "step_consider_job", { id: item.id }, state, metrics.operations));
    }

    const start = state.time;
    const finish = start + item.duration;
    const lateness = Math.max(0, finish - item.deadline);
    state.time = finish;
    state.maxLateness = Math.max(state.maxLateness, lateness);
    state.objectiveValue = state.maxLateness;
    state.scheduled.push({
      ...item,
      start,
      finish,
      lateness,
    });
    state.decisions.push({
      id: item.id,
      start,
      finish,
      lateness,
      maxLateness: state.maxLateness,
    });

    addOperations(metrics, 4);
    if (recordSteps) {
      steps.push(
        makeStep(stepIndex++, 6, "step_schedule_job", {
          id: item.id,
          start,
          finish,
          lateness,
        }, state, metrics.operations),
      );
    }
  }

  if (recordSteps) {
    state.currentId = null;
    state.currentIndex = null;
    steps.push(makeStep(stepIndex++, null, "step_finished", {}, state, metrics.operations));
  }

  const inversionInfo = countInversionsByDeadline(state.scheduled);
  return {
    problemId: "minimizeLateness",
    algorithmId,
    items: decorated,
    sortedItems,
    steps,
    operationTotal: metrics.operations,
    result: {
      schedule: state.scheduled,
      objectiveValue: state.maxLateness,
    },
    optimal: {
      objectiveValue: 0,
      schedule: [],
    },
    proof: {
      style: "exchangeArgument",
      deadlineOrderIds: [...decorated]
        .sort((a, b) => a.deadline - b.deadline || a.duration - b.duration || numericIdCompare(a, b))
        .map((item) => item.id),
      scheduleOrderIds: state.scheduled.map((item) => item.id),
      inversions: inversionInfo.inversions,
      inversionPairs: inversionInfo.pairs,
    },
  };
}

function simulateLateness(items, algorithmId) {
  const current = runLatenessCore(items, algorithmId, true);
  const optimal = runLatenessCore(items, "earliest-deadline", false);
  current.optimal = {
    objectiveValue: optimal.result.objectiveValue,
    schedule: optimal.result.schedule,
  };
  return current;
}

export function simulateProblem(problemId, algorithmId, items) {
  if (problemId === "intervalScheduling") {
    return simulateIntervalScheduling(items, algorithmId);
  }
  if (problemId === "intervalPartitioning") {
    return simulatePartitioning(items, algorithmId);
  }
  return simulateLateness(items, algorithmId);
}

export function computeOptimalOutcome(problemId, items) {
  if (problemId === "intervalScheduling") {
    const optimal = computeIntervalSchedulingOptimal(items);
    return {
      objectiveValue: optimal.count,
      selectedIds: optimal.selectedIds,
    };
  }
  if (problemId === "intervalPartitioning") {
    const depthInfo = computeDepthWithWitness(decorateIntervals(items));
    return {
      objectiveValue: depthInfo.depth,
      witnessIds: depthInfo.witnessIds,
    };
  }
  const optimal = runLatenessCore(items, "earliest-deadline", false);
  return {
    objectiveValue: optimal.result.objectiveValue,
    schedule: optimal.result.schedule,
  };
}

export function buildConflictEdges(problemId, items, schedule = []) {
  if (problemId === "minimizeLateness") {
    const inversions = countInversionsByDeadline(schedule);
    return inversions.pairs.map(([from, to]) => ({ from, to, type: "inversion" }));
  }

  const edges = [];
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      if (intervalsOverlap(items[left], items[right])) {
        edges.push({ from: items[left].id, to: items[right].id, type: "conflict" });
      }
    }
  }
  return edges;
}
