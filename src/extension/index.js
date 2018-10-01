/* global chrome */

const pouchdb = require('pouchdb-browser');

const cancelables = {};

chrome.runtime.onConnectExternal.addListener((port) => {
  console.log('Connection established');

  port.onMessage.addListener((message) => {
    const {
      database,
      key,
      replyChannel,
      type,
      direction,
    } = message;

    if (!type) return console.error('Message is missing "type"');
    if (!database) return console.error('Message is missing "database"');
    if (!key) return console.error('Message is missing "key"');
    if (!replyChannel) return console.error('Message is missing "replyChannel"');

    const func = direction ? pouchdb(database)[key][direction] : pouchdb(database)[key];
    if (!func) return console.error(`Database:"${database}" and Key:"${key}" does not map to a valid function.`);

    if (type === 'function') {
      return invokeKey(message)
        .then(result => postMessage(port, { name: message.replyChannel, result }))
        .catch(err => postMessage(port, { name: message.replyChannel, err }));
    }

    if (type === 'eventEmitter') {
      if (message.action === 'call') {
        const eventCallback = event => (...args) => postMessage(port, {
          name: message.replyChannel,
          action: 'event',
          event,
          args,
        });

        const cancelableResult = invokeKey(message)
          .on('change', eventCallback('change'))
          .on('paused', eventCallback('paused'))
          .on('active', eventCallback('active'))
          .on('denied', eventCallback('denied'))
          .on('complete', eventCallback('complete'))
          .on('error', eventCallback('error'));

        if (cancelableResult.cancel) {
          cancelables[message.replyChannel] = cancelableResult;
        }
        return cancelableResult;
      }

      if (message.action === 'cancel') {
        if (!cancelables[message.replyChannel]) {
          return console.error('Received cancel message, but no cancelable object exists.', message);
        }

        console.log(`Canceling action on channel "${message.replyChannel}"`);
        cancelables[message.replyChannel].cancel();
        delete cancelables[message.replyChannel];

        postMessage(port, { name: message.replyChannel, canceled: true });
      }
    }

    console.error('Unprocessable message type', message);
    return false;
  });
});

function postMessage(port, message) {
  console.log('Posting message', message);
  port.postMessage(message);
}

function invokeKey(message) {
  const func = pouchdb(message.database)[message.key];
  if (!func) return console.error(`Database:"${message.database}" and Key:"${message.key}" does not map to a valid function.`);

  return func(...message.args);
}
