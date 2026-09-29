const test = require('tape');
const sinon = require('sinon');
const TaskGather = require('../lib/tasks/gather');

const logger = {debug: () => {}, info: () => {}, error: () => {}, warn: () => {}, child: () => logger};
const TIMEOUT_SECS = 5;
const ASR_TIMEOUT_MS = 1200;

const makeGather = (vendor) => {
  const gather = new TaskGather(logger, {input: ['speech'], timeout: TIMEOUT_SECS, recognizer: {vendor}});
  gather.vendor = vendor;
  gather.isContinuousAsr = true;
  gather.asrTimeout = ASR_TIMEOUT_MS;
  gather._bufferedTranscripts = [];
  gather.digitBuffer = '';
  gather.consolidateTranscripts = () => ({});
  gather._resolve = sinon.spy();
  return gather;
};

test('gather: continuous asr resolves timeout when nothing was heard (speechmatics)', (t) => {
  const clock = sinon.useFakeTimers();
  const gather = makeGather('speechmatics');
  gather._startTimer();
  clock.tick(TIMEOUT_SECS * 1000 + ASR_TIMEOUT_MS * 10);
  t.ok(gather._resolve.calledOnceWith('timeout'), 'resolves with timeout instead of listening forever');
  clock.restore();
  t.end();
});

test('gather: continuous asr resolves timeout at the no-input timeout for other vendors too', (t) => {
  const clock = sinon.useFakeTimers();
  const gather = makeGather('deepgram');
  gather._startTimer();
  clock.tick(TIMEOUT_SECS * 1000);
  t.ok(gather._resolve.calledOnceWith('timeout'), 'resolves at the timeout, not one asr window later');
  clock.restore();
  t.end();
});

test('gather: continuous asr with buffered transcripts still waits for the asr window', (t) => {
  const clock = sinon.useFakeTimers();
  const gather = makeGather('speechmatics');
  gather._bufferedTranscripts = [{alternatives: [{transcript: 'hola'}]}];
  gather._startTimer();
  clock.tick(TIMEOUT_SECS * 1000);
  t.ok(gather._resolve.notCalled, 'not resolved when the timeout fires with transcripts buffered');
  clock.tick(ASR_TIMEOUT_MS);
  t.ok(gather._resolve.calledOnceWith('speech'), 'resolved as speech after the asr window');
  clock.restore();
  t.end();
});
