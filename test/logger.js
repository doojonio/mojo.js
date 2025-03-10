import {captureOutput, sleep} from '../lib/util.js';
import chalk from 'chalk';
import File from '../lib/file.js';
import Logger from '../lib/logger.js';
import t from 'tap';

t.test('Logger', async t => {
  const dir = await File.tempDir();

  t.test('Logging to file', async t => {
    const file = dir.child('file.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'error', formatter: Logger.stringFormatter});
    t.same(logger.destination, stream);
    logger.error('Works');
    logger.error('Works too');
    logger.fatal('I ♥ Mojolicious');
    logger.error('This too');
    logger.trace('Not this');
    logger.debug('This not');
    while (stream.writableLength) {
      await sleep(10);
    }
    let content = await file.readFile('utf8');
    t.match(content, /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\] \[error\] Works\n/);
    t.match(content, /\[.+\] \[error\] Works too\n/);
    t.match(content, /\[.+\] \[fatal\] I ♥ Mojolicious\n/);
    t.match(content, /\[.+\] \[error\] This too\n/);
    t.notMatch(content, /\[.+\] \[trace\] Not this\n/);
    t.notMatch(content, /\[.+\] \[debug\] This not\n/);

    logger.level = 'trace';
    logger.trace('Now this');
    logger.debug('And this');
    while (stream.writableLength) {
      await sleep(10);
    }
    content = await file.readFile('utf8');
    t.match(content, /\[.+\] \[trace\] Now this\n/);
    t.match(content, /\[.+\] \[debug\] And this\n/);
  });

  t.test('History', async t => {
    const file = dir.child('file.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'info', historySize: 5, formatter: Logger.stringFormatter});
    t.same(logger.destination, stream);
    logger.error('First');
    logger.fatal('Second');
    logger.debug('Third');
    logger.info('Fourth');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.match(content, /\[.+\] \[error\] First\n/);
    t.match(content, /\[.+\] \[fatal\] Second\n/);
    t.match(content, /\[.+\] \[info\] Fourth\n/);
    t.notMatch(content, /\[.+\] \[debug\] Third\n/);

    t.equal(logger.history[0].level, 'error');
    t.match(logger.history[0].msg, /First/);
    t.equal(logger.history[1].level, 'fatal');
    t.match(logger.history[1].msg, /Second/);
    t.equal(logger.history[2].level, 'info');
    t.match(logger.history[2].msg, /Fourth/);
    t.same(logger.history[3], undefined);

    logger.error('Fifth');
    logger.fatal('Sixth');
    logger.fatal('Seventh');
    while (stream.writableLength) {
      await sleep(10);
    }
    t.equal(logger.history[0].level, 'fatal');
    t.match(logger.history[0].msg, /Second/);
    t.equal(logger.history[1].level, 'info');
    t.match(logger.history[1].msg, /Fourth/);
    t.equal(logger.history[2].level, 'error');
    t.match(logger.history[2].msg, /Fifth/);
    t.equal(logger.history[3].level, 'fatal');
    t.match(logger.history[3].msg, /Sixth/);
    t.equal(logger.history[4].level, 'fatal');
    t.match(logger.history[4].msg, /Seventh/);
    t.same(logger.history[5], undefined);
  });

  t.test('Logging to STDERR', async t => {
    const logger = new Logger();
    t.same(logger.destination, process.stderr);
  });

  t.test('Unsupported level', async t => {
    const logger = new Logger();
    t.throws(() => {
      logger.level = 'unknown';
    }, {code: 'ERR_ASSERTION'});
  });

  t.test('trace', async t => {
    const file = dir.child('trace.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'trace', formatter: Logger.stringFormatter});
    logger.trace('One');
    logger.debug('Two');
    logger.info('Three');
    logger.warn('Four');
    logger.error('Five');
    logger.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.match(content, /\[.+\] \[trace\] One\n/);
    t.match(content, /\[.+\] \[debug\] Two\n/);
    t.match(content, /\[.+\] \[info\] Three\n/);
    t.match(content, /\[.+\] \[warn\] Four\n/);
    t.match(content, /\[.+\] \[error\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] Six\n/);
  });

  t.test('debug', async t => {
    const file = dir.child('debug.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'debug', formatter: Logger.stringFormatter});
    logger.trace('One');
    logger.debug('Two');
    logger.info('Three');
    logger.warn('Four');
    logger.error('Five');
    logger.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.notMatch(content, /\[.+\] \[trace\] One\n/);
    t.match(content, /\[.+\] \[debug\] Two\n/);
    t.match(content, /\[.+\] \[info\] Three\n/);
    t.match(content, /\[.+\] \[warn\] Four\n/);
    t.match(content, /\[.+\] \[error\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] Six\n/);
  });

  t.test('info', async t => {
    const file = dir.child('info.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'info', formatter: Logger.stringFormatter});
    logger.trace('One');
    logger.debug('Two');
    logger.info('Three');
    logger.warn('Four');
    logger.error('Five');
    logger.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.notMatch(content, /\[.+\] \[trace\] One\n/);
    t.notMatch(content, /\[.+\] \[debug\] Two\n/);
    t.match(content, /\[.+\] \[info\] Three\n/);
    t.match(content, /\[.+\] \[warn\] Four\n/);
    t.match(content, /\[.+\] \[error\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] Six\n/);
  });

  t.test('warn', async t => {
    const file = dir.child('warn.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'warn', formatter: Logger.stringFormatter});
    logger.trace('One');
    logger.debug('Two');
    logger.info('Three');
    logger.warn('Four');
    logger.error('Five');
    logger.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.notMatch(content, /\[.+\] \[trace\] One\n/);
    t.notMatch(content, /\[.+\] \[debug\] Two\n/);
    t.notMatch(content, /\[.+\] \[info\] Three\n/);
    t.match(content, /\[.+\] \[warn\] Four\n/);
    t.match(content, /\[.+\] \[error\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] Six\n/);
  });

  t.test('error', async t => {
    const file = dir.child('error.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'error', formatter: Logger.stringFormatter});
    logger.trace('One');
    logger.debug('Two');
    logger.info('Three');
    logger.warn('Four');
    logger.error('Five');
    logger.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.notMatch(content, /\[.+\] \[trace\] One\n/);
    t.notMatch(content, /\[.+\] \[debug\] Two\n/);
    t.notMatch(content, /\[.+\] \[info\] Three\n/);
    t.notMatch(content, /\[.+\] \[warn\] Four\n/);
    t.match(content, /\[.+\] \[error\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] Six\n/);
  });

  t.test('fatal', async t => {
    const file = dir.child('fatal.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'fatal', formatter: Logger.stringFormatter});
    logger.trace('One');
    logger.debug('Two');
    logger.info('Three');
    logger.warn('Four');
    logger.error('Five');
    logger.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.notMatch(content, /\[.+\] \[trace\] One\n/);
    t.notMatch(content, /\[.+\] \[debug\] Two\n/);
    t.notMatch(content, /\[.+\] \[info\] Three\n/);
    t.notMatch(content, /\[.+\] \[warn\] Four\n/);
    t.notMatch(content, /\[.+\] \[error\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] Six\n/);
  });

  t.test('Child logger', async t => {
    const file = dir.child('child.log');
    const stream = (await file.touch()).createWriteStream();
    const logger = new Logger({destination: stream, level: 'trace', formatter: Logger.stringFormatter});
    const child = logger.child({requestId: 123});
    child.trace('One');
    child.debug('Two');
    child.info('Three');
    child.warn('Four');
    child.error('Five');
    logger.info('No prefix');
    child.fatal('Six');
    while (stream.writableLength) {
      await sleep(10);
    }
    const content = await file.readFile('utf8');
    t.match(content, /\[.+\] \[trace\] \[123\] One\n/);
    t.match(content, /\[.+\] \[debug\] \[123\] Two\n/);
    t.match(content, /\[.+\] \[info\] \[123\] Three\n/);
    t.match(content, /\[.+\] \[warn\] \[123\] Four\n/);
    t.match(content, /\[.+\] \[error\] \[123\] Five\n/);
    t.match(content, /\[.+\] \[fatal\] \[123\] Six\n/);
    t.match(content, /\[.+\] \[info\] No prefix\n/);
  });

  t.test('Color', async t => {
    chalk.level = 1;
    const logger = new Logger({destination: process.stdout, level: 'trace'});
    const output = await captureOutput(async () => {
      logger.trace('One');
      logger.debug('Two');
      logger.info('Three');
      logger.warn('Four');
      logger.error('Five');
      logger.fatal('Six');
    });
    t.match(output, /\[.+\] \[trace\] One\n/);
    t.match(output, /\[.+\] \[debug\] Two\n/);
    t.match(output, /\[.+\] \[info\] Three\n/);
    t.match(output, /\[33m\[.+\] \[warn\] Four.*\[39m/);
    t.match(output, /\[31m\[.+\] \[error\] Five.*\[39m/);
    t.match(output, /\[31m\[.+\] \[fatal\] Six.*\[39m/);
  });

  t.test('JSON', async t => {
    chalk.level = 1;
    const logger = new Logger({destination: process.stdout, level: 'trace', formatter: Logger.jsonFormatter});
    const child = logger.child({requestId: 23, test: 'works'});
    const output = await captureOutput(async () => {
      child.trace('One');
      child.debug('Two');
      child.info('Three');
      child.warn('Four');
      child.error('Five');
      child.fatal('Six');
    });
    t.match(output, /"msg":"One"/);
    t.match(output, /"time":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z"/);
    t.match(output, /"level":"trace"/);
    t.match(output, /"requestId":23/);
    t.match(output, /"test":"works"/);
    t.match(output, /"msg":"Two"/);
    t.match(output, /"msg":"Three"/);
    t.match(output, /"msg":"Four"/);
    t.match(output, /"msg":"Five"/);
    t.match(output, /"msg":"Six"/);
  });

  t.test('systemd', async t => {
    const logger = new Logger({destination: process.stdout, level: 'trace', formatter: Logger.systemdFormatter});
    const output = await captureOutput(async () => {
      logger.trace('Seven');
      logger.fatal('Eight');
    });
    t.match(output, /<7>\[t\] Seven\n/);
    t.match(output, /<2>\[f\] Eight\n/);

    const child = logger.child({requestId: 24, test: 'works'});
    const output2 = await captureOutput(async () => {
      child.trace('One');
      child.debug('Two');
      child.info('Three');
      child.warn('Four');
      child.error('Five');
      child.fatal('Six');
    });
    t.match(output2, /<7>\[t\] \[24\] One\n/);
    t.match(output2, /<6>\[d\] \[24\] Two\n/);
    t.match(output2, /<5>\[i\] \[24\] Three\n/);
    t.match(output2, /<4>\[w\] \[24\] Four\n/);
    t.match(output2, /<3>\[e\] \[24\] Five\n/);
    t.match(output2, /<2>\[f\] \[24\] Six\n/);
  });
});
