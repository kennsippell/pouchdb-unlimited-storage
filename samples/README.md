# pouchdb-unlimited-storage Samples

## Install the Chrome extension

1. Build the main project `gulp`
1. `cd samples/extension`
1. Follow steps 1,2,3 in the Chrome Extension [Getting Started](https://developer.chrome.com/extensions/getstarted#manifest). The extension directory is `samples/extension`.

## Sample Application

1. Install the sample Chrome extension (above)
1. Replace `chromeExtensionId` in `samples/client/client.js` with the id of the extension once installed (visible on `chrome://extensions`)
1. `cd samples/client`
1. `gulp`
1. `http-server`
1. Navigate to `http://localhost:8080`
