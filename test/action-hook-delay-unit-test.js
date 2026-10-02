const test = require('tape');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const Emitter = require('events');

const logger = {debug: () => {}, info: () => {}, error: () => {}, warn: () => {}, child: () => logger};

const makeProcessor = (exec) => {
  const ActionHookDelayProcessor = proxyquire('../lib/utils/action-hook-delay', {
    '../tasks/make_task': () => ({name: 'say', exec}),
  });
  const ep = new Emitter();
  const cs = {ep};
  const ahd = new ActionHookDelayProcessor(logger, {
    actions: [{verb: 'say', text: 'un momento'}],
    noResponseTimeout: 1,
    retries: 2,
  }, cs);
  return {ahd, cs, ep};
};

test('action-hook-delay: no crash when the endpoint goes away while the action starts', (t) => {
  const clock = sinon.useFakeTimers();
  const {ahd, cs} = makeProcessor(() => {
    cs.ep = null;
    return Promise.resolve();
  });
  ahd.start();
  t.doesNotThrow(() => clock.tick(1000), 'no-response timer survives a null endpoint');
  clock.restore();
  t.end();
});

test('action-hook-delay: listens for playback events while the endpoint is alive', (t) => {
  const clock = sinon.useFakeTimers();
  const {ahd, ep} = makeProcessor(() => Promise.resolve());
  ahd.start();
  clock.tick(1000);
  t.equal(ep.listenerCount('playback-start'), 1, 'playback-start listener registered');
  t.equal(ep.listenerCount('playback-stop'), 1, 'playback-stop listener registered');
  ep.emit('playback-stop', {});
  t.equal(ahd._taskInProgress, null, 'playback-stop clears the task in progress');
  clock.restore();
  t.end();
});
