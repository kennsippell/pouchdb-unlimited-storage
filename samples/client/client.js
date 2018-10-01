const PouchdbUnlimitedStorage = require('../../src/client');

const unlimitedOptions = {
  chromeExtensionId: 'jalhnbpalbfpokpfechjfbkocddggdbf',
};
const unlimitedPouch = new PouchdbUnlimitedStorage(unlimitedOptions);

const db = unlimitedPouch('database');

(async () => {
  console.log('Requesting all changes since now');
  db.changes({
    since: 'now',
    live: true,
    include_docs: true,
  })
    .on('change', change => console.log('onChange triggered', change))
    .on('error', console.error);

  const id = new Date().toISOString();

  const putResult = await db.put({ _id: id, title: 'New Object' });
  console.log('Put an object', putResult);

  const getResult = await unlimitedPouch('database').get(id);
  console.log('Get the same object', getResult);

  try {
    const allDocsResult = await db.allDocs({ include_docs: true, attachments: true });
    console.log('Got all documents', allDocsResult);
  } catch (err) {
    console.error('Failed to get all docs', err);
  }
})();
