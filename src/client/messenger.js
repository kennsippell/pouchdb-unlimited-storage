function Messenger(options, runtime) {
  const channels = {};

  if (!options.chromeExtensionId) throw 'options.chromeExtensionId is required';

  if (!runtime) throw 'runtime is undefined';
  this.port = runtime.connect(options.chromeExtensionId);

  Messenger.prototype.post = function post(...args) {
    const self = this;
    return self.port.postMessage(...args);
  };

  Messenger.prototype.processMessage = function processMessage(message) {
    if (!message) return;

    const { name, result, err } = message;
    if (name && channels[name]) {
      if (message.action === 'event') {
        if (channels[name].callback) channels[name].callback(message);
      } else if (channels[name].resolve) {
        if (err) channels[name].reject(err);
        channels[name].resolve(result);
        delete channels[name];
      }
    }
  };
  this.port.onMessage.addListener(this.processMessage);

  Messenger.prototype.listen = function listen(channelName) {
    return new Promise((resolve, reject) => {
      channels[channelName] = Object.assign({}, channels[channelName], { resolve, reject });
    });
  };

  Messenger.prototype.registerCallback = function registerCallback(channelName, callback) {
    channels[channelName] = Object.assign({}, channels[channelName], { callback });
  };

  Messenger.prototype.unregisterCallback = function unregisterCallback(channelName) {
    if (!channels[channelName]) return;
    channels[channelName].callback = undefined;
  };
}

module.exports = Messenger;
