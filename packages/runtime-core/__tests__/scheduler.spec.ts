import {
  queueJob,
  nextTick,
  queuePostFlushCb,
  queuePreFlushCb,
  flushPreFlushCbs,
  flushPostFlushCbs
} from '../src/scheduler';

describe('scheduler', () => {
  it('nextTick', async () => {
    const calls: string[] = [];
    const dummyThen = Promise.resolve().then();
    const job1 = () => {
      calls.push('job1');
    };
    const job2 = () => {
      calls.push('job2');
    };
    nextTick(job1);
    job2();

    expect(calls.length).toBe(1);
    await dummyThen;
    expect(calls.length).toBe(2);
    expect(calls).toMatchObject(['job2', 'job1']);
  });

  it('queueJob', async () => {
    const calls: string[] = [];
    const job1 = () => {
      calls.push('job1');
    };
    const job2 = () => {
      calls.push('job2');
    };
    queueJob(job1);
    queueJob(job2);
    expect(calls).toEqual([]);
    await nextTick();
    expect(calls).toEqual(['job1', 'job2']);
  });

  it('queuePreFlushCb', async () => {
    const calls: string[] = [];
    const cb1 = () => {
      calls.push('cb1');
    };
    const cb2 = () => {
      calls.push('cb2');
    };

    queuePreFlushCb(cb1);
    queuePreFlushCb(cb2);

    expect(calls).toEqual([]);
    await nextTick();
    expect(calls).toEqual(['cb1', 'cb2']);
  });

  it('queuePostFlushCb', async () => {
    const calls: string[] = [];
    const cb1 = () => {
      calls.push('cb1');
    };
    const cb2 = () => {
      calls.push('cb2');
    };
    const cb3 = () => {
      calls.push('cb3');
    };

    queuePostFlushCb([cb1, cb2]);
    queuePostFlushCb(cb3);

    expect(calls).toEqual([]);
    await nextTick();
    expect(calls).toEqual(['cb1', 'cb2', 'cb3']);
  });

  it('pre最先执行，然后执行job，最后执行post', async () => {
    const calls: string[] = [];
    const job1 = () => {
      calls.push('job1');
    };
    const cb1 = () => {
      calls.push('cb1');
      queuePostFlushCb(cb3);
      queueJob(job1);
      queuePreFlushCb(cb2);
    };
    const cb2 = () => {
      calls.push('cb2');
    };

    const cb3 = () => {
      calls.push('cb3');
    };

    queuePreFlushCb(cb1);
    await nextTick();
    expect(calls).toEqual(['cb1', 'cb2', 'job1', 'cb3']);
  });
});
