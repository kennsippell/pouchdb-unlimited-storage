/* global chrome */

const Wrapper = require('./wrapper');
const Messenger = require('./messenger');

function UnlimitedPouchdb(options, runtime = chrome && chrome.runtime) {
  const messenger = new Messenger(options, runtime);
  const wrapper = new Wrapper(messenger);
  return wrapper.wrap();
}

module.exports = UnlimitedPouchdb;
