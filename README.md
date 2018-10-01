# PouchDB-Unlimited-Storage

Storage limits for PouchDB + IndexedDB are limited to about 6% of the available memory on a machine. There is currently no API to request more storage space for IndexedDB. However, Chrome extensions support an `unlimitedStorage` mode which allows IndexedDB to occupy 100% of the available memory. This library enables you to use PouchDB with an IndexedDB inside the extension to expand the storage capacity.

    const PouchdbUnlimitedStorage = require('pouchdb-unlimited-storage');

    const pouchdb = new PouchdbUnlimitedStorage({
      chromeExtensionId: 'jalhnbpalbfpokpfechjfbkocddggdbf',
    });

    const db = pouchdb('database');

    db.changes({
      since: 'now',
      live: true,
      include_docs: true,
    })
      .on('change', change => console.log('onChange triggered', change))
      .on('error', console.error);

    const id = new Date().toISOString();
    await db.put({ _id: id, title: 'New Object' });
    await unlimitedPouch('database').get(id);

Project contains [samples](tree/master/samples/) of a Chrome extension which requests `unlimitedStorage` and a sample client application which uses the library. This project is a proof of concept and not production ready. Works for most basic scenarios including `replicate`, `sync`, etc.
