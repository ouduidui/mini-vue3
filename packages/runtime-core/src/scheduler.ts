import { isArray } from 'shared/index';

export type SchedulerJobs = SchedulerJob | SchedulerJob[];

export interface SchedulerJob extends Function {
  id?: number;
}

let isFlushing = false;
let isFlushPending = false;

const queue: SchedulerJob[] = [];
let flushIndex = 0;

const pendingPreFlushCbs: SchedulerJob[] = [];
let activePreFlushCbs: SchedulerJob[] | null = null;
let preFlushIndex = 0;

const pendingPostFlushCbs: SchedulerJob[] = [];
let activePostFlushCbs: SchedulerJob[] | null = null;
let postFlushIndex = 0;

const resolvedPromise: Promise<any> = Promise.resolve();
let currentFlushPromise: Promise<void> | null = null;

let currentPreFlushParentJob: SchedulerJob | null = null;

export function nextTick<T = void>(fn?: (this: T) => void) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(fn) : p;
}

export function queueJob(job: SchedulerJob) {
  if (!queue.length || !queue.includes(job, flushIndex)) {
    queue.push(job);
  }
  queueFlush();
}

export function queuePreFlushCb(cb: SchedulerJob) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
}

export function queuePostFlushCb(cb: SchedulerJobs) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

function flushJobs() {
  isFlushPending = false;
  isFlushing = true;
  flushPreFlushCbs();

  queue.sort((a, b) => getId(a) - getId(b));
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      job();
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;

    flushPostFlushCbs();

    isFlushing = false;
    currentFlushPromise = null;

    if (queue.length || pendingPreFlushCbs.length || pendingPostFlushCbs.length) {
      flushJobs();
    }
  }
}

function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
    pendingPreFlushCbs.length = 0;

    for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
      activePreFlushCbs[preFlushIndex]();
    }

    activePreFlushCbs = null;
    preFlushIndex = 0;
    currentPreFlushParentJob = null;
  }
}

function flushPostFlushCbs() {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)];
    pendingPostFlushCbs.length = 0;

    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }

    activePostFlushCbs = deduped;
    activePostFlushCbs.sort((a, b) => getId(a) - getId(b));

    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      activePostFlushCbs[postFlushIndex]();
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}

function queueCb(cb: SchedulerJobs, activeQueue: SchedulerJob[] | null, pendingQueue: SchedulerJob[], index: number) {
  if (!isArray(cb)) {
    if (!activeQueue || !activeQueue.includes(cb, index)) {
      pendingQueue.push(cb);
    }
  } else {
    pendingQueue.push(...cb);
  }
  queueFlush();
}

const getId = (job: SchedulerJob): number => (job.id == null ? Infinity : job.id);
