const uuidv4 = require('uuid/v4');

function Wrapper(messenger) {
  if (!messenger) throw 'messenger undefined';
  this.messenger = messenger;

  this.uid = (new Date()).toISOString();

  const KeyMap = {
    destroy: wrapFunction,
    put: wrapFunction,
    post: wrapFunction,
    get: wrapFunction,
    remove: wrapFunction,
    bulkDocs: wrapFunction,
    bulkGet: wrapFunction,
    allDocs: wrapFunction,
    putAttachment: wrapFunction,
    getAttachment: wrapFunction,
    removeAttachment: wrapFunction,
    query: wrapFunction,
    viewCleanup: wrapFunction,
    info: wrapFunction,
    compact: wrapFunction,
    revsDiff: wrapFunction,
    changes: wrapEventEmitter,
    sync: wrapEventEmitter,
    replicate: wrapReplicate,
  };

  Wrapper.prototype.wrap = function wrap() {
    const self = this;
    const databases = {};

    return (name) => {
      if (!databases[name]) {
        databases[name] = {};
        Object.keys(KeyMap).forEach((key) => {
          const wrappingFunction = KeyMap[key];
          databases[name][key] = wrappingFunction(name, key, self.messenger);
        });
      }

      return databases[name];
    };
  };

  function wrapFunction(database, key, msnger) {
    return (...args) => {
      const message = createChannel('function', database, key, args);
      msnger.post(message);
      return msnger.listen(message.replyChannel);
    };
  }

  function wrapEventEmitter(database, key, msnger) {
    return wrappedEventingFunction(database, key, msnger);
  }

  function wrapReplicate(database, key, msnger) {
    const wrapDirection = direction => wrappedEventingFunction(database, key, msnger, { direction }, true);
    return {
      to: wrapDirection('to'),
      from: wrapDirection('from'),
    };
  }

  function wrappedEventingFunction(database, key, msnger, channelAttributes, includePromise = false) {
    return (...callArgs) => {
      const eventListeners = {};
      const messageCallFunction = createChannel('eventEmitter', database, key, callArgs, { action: 'call' }, channelAttributes);
      msnger.post(messageCallFunction);
      const promiseToCall = includePromise && msnger.listen(messageCallFunction.replyChannel);

      msnger.registerCallback(messageCallFunction.replyChannel, (message) => {
        const { event, args } = message;
        if (!Array.isArray(eventListeners[event])) return;
        eventListeners[event].forEach(listener => listener(...args));
      });

      let selfReferencedResult = {
        on: (event, cb) => {
          if (!Array.isArray(eventListeners[event])) eventListeners[event] = [];
          eventListeners[event].push(cb);
          return selfReferencedResult;
        },
        cancel: (...cancelArgs) => {
          const messageCancelFunction = createChannel('eventEmitter', database, key, cancelArgs, { action: 'cancel' });
          msnger.post(messageCancelFunction);
          return msnger
            .listen(messageCancelFunction.replyChannel)
            .then(() => msnger.unregisterCallback(messageCallFunction.replyChannel));
        },
      };

      if (includePromise) {
        selfReferencedResult = Object.assign(promiseToCall, selfReferencedResult);
      }

      return selfReferencedResult;
    };
  }

  function createChannel(type, database, key, args, ...attributes) {
    return Object.assign(
      {
        type,
        database,
        key,
        args,
        replyChannel: `${key}-${uuidv4()}`,
      },
      ...attributes,
    );
  }
}

module.exports = Wrapper;
