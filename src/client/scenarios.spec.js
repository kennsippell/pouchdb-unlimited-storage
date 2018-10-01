/* global describe, it */

const chai = require('chai');
const sinon = require('sinon');
const UnlimitedPouchdb = require('.');
chai.use(require('chai-string'));

const { expect } = chai;
const mockOptions = { chromeExtensionId: 'foo' };

describe('E2E scenarios with mocked messages', () => {
  it('Successful round-trip for key type:"function"', async () => {
    const mockPort = {
      onMessage: {
        addListener: sinon.stub(),
      },
      postMessage: sinon.stub(),
    };

    global.chrome = {
      runtime: {
        connect: sinon.stub().returns(mockPort),
      },
    };
    const unlimitedDb = UnlimitedPouchdb(mockOptions);

    const db = unlimitedDb('database');
    expect(db.put).to.be.an('function');
    expect(db.allDocs).to.be.an('function');

    const putPayload = {
      _id: 'id',
      title: 'New Object',
    };
    const promiseToPut = db.put(putPayload);

    expect(mockPort.postMessage.callCount).to.eq(1);
    const [postMessageArgs] = mockPort.postMessage.args[0];
    expect(postMessageArgs).to.deep.contain({
      key: 'put',
      args: [putPayload],
    });
    expect(postMessageArgs.replyChannel).to.startsWith('put-');

    const [runtimeProcessor] = mockPort.onMessage.addListener.args[0];
    const mockResult = { foo: 'bar' };
    runtimeProcessor({
      name: postMessageArgs.replyChannel,
      result: mockResult,
    });

    return promiseToPut.then((result) => {
      expect(result).to.deep.eq(mockResult);
    });
  });

  it('Successful round-trip for key type:"eventEmitter"', async () => {
    // Setup
    const mockPort = {
      onMessage: {
        addListener: sinon.stub(),
      },
      postMessage: sinon.stub(),
    };

    global.chrome = {
      runtime: {
        connect: sinon.stub().returns(mockPort),
      },
    };

    const payload = {
      since: 'now',
      live: true,
      include_docs: true,
    };
    const onChangeStub = sinon.stub();
    const onCompleteStub = sinon.stub();
    const onErrorStub = sinon.stub();

    // Execute function in the extension
    const unlimitedDb = UnlimitedPouchdb(mockOptions);
    const db = unlimitedDb('database');
    const changesResult = db.changes(payload)
      .on('change', onChangeStub)
      .on('complete', onCompleteStub)
      .on('complete', onCompleteStub)
      .on('error', onErrorStub);

    expect(db.changes).to.be.an('function');
    expect(db.sync).to.be.an('function');
    expect(changesResult.cancel).to.be.an('function');
    expect(mockPort.postMessage.callCount).to.eq(1);
    const [postMessageArgs0] = mockPort.postMessage.args[0];
    expect(postMessageArgs0).to.deep.contain({
      key: 'changes',
      args: [payload],
    });
    expect(postMessageArgs0.replyChannel).to.startsWith('changes-');

    // Extension replies with an event
    const [runtimeProcessor] = mockPort.onMessage.addListener.args[0];
    const eventFromExtension = {
      name: postMessageArgs0.replyChannel,
      action: 'event',
      event: 'complete',
      args: ['arg1', 'arg2'],
    };
    runtimeProcessor(eventFromExtension);

    expect(onErrorStub.callCount).to.eq(0);
    expect(onChangeStub.callCount).to.eq(0);
    expect(onCompleteStub.callCount).to.eq(2);
    expect(onCompleteStub.args[0]).to.deep.eq(eventFromExtension.args);

    // Cancel scenario
    const promisedCancel = changesResult.cancel();
    expect(mockPort.postMessage.callCount).to.eq(2);
    const [postMessageArgs1] = mockPort.postMessage.args[1];
    expect(postMessageArgs1).to.deep.contain({
      key: 'changes',
      action: 'cancel',
    });

    // Cancel result
    runtimeProcessor({
      name: postMessageArgs1.replyChannel,
      canceled: true,
    });
    return promisedCancel;
  });

  it('Successful round-trip for key type:"replicate"', async () => {
    // Setup
    const mockPort = {
      onMessage: {
        addListener: sinon.stub(),
      },
      postMessage: sinon.stub(),
    };

    global.chrome = {
      runtime: {
        connect: sinon.stub().returns(mockPort),
      },
    };

    const payload = {
      since: 'now',
      live: true,
      include_docs: true,
    };
    const onChangeStub = sinon.stub();
    const onCompleteStub = sinon.stub();
    const onErrorStub = sinon.stub();

    // Execute function in the extension
    const unlimitedDb = UnlimitedPouchdb(mockOptions);
    const db = unlimitedDb('database');
    expect(db.replicate.to).to.be.an('function');
    expect(db.replicate.from).to.be.an('function');

    const replicationResult = db.replicate.to(payload)
      .on('change', onChangeStub)
      .on('complete', onCompleteStub)
      .on('complete', onCompleteStub)
      .on('error', onErrorStub);

    expect(replicationResult.cancel).to.be.an('function');
    expect(mockPort.postMessage.callCount).to.eq(1);
    const [postMessageArgs0] = mockPort.postMessage.args[0];
    expect(postMessageArgs0).to.deep.contain({
      key: 'replicate',
      direction: 'to',
      args: [payload],
    });
    expect(postMessageArgs0.replyChannel).to.startsWith('replicate-');

    // Extension replies with result
    const [runtimeProcessor] = mockPort.onMessage.addListener.args[0];
    const eventFromExtension = {
      name: postMessageArgs0.replyChannel,
      action: 'event',
      event: 'complete',
      args: ['arg1', 'arg2'],
    };
    runtimeProcessor(eventFromExtension);

    expect(onErrorStub.callCount).to.eq(0);
    expect(onChangeStub.callCount).to.eq(0);
    expect(onCompleteStub.callCount).to.eq(2);
    expect(onCompleteStub.args[0]).to.deep.eq(eventFromExtension.args);

    // Trigger replication completion
    const expectedReplicationResult = { foo: 'bar' };
    const replicationCompleteMessage = { name: postMessageArgs0.replyChannel, result: expectedReplicationResult };
    runtimeProcessor(replicationCompleteMessage);

    return replicationResult.then((actualResult) => {
      expect(actualResult).to.deep.eq(expectedReplicationResult);
    });
  });
});
