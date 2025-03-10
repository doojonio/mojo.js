import Client from '../client.js';
import Server from '../server.js';

export default class MockClient extends Client {
  constructor (options) {
    super(options);
    this.server = undefined;
  }

  static newMockClient (app, options) {
    return new MockClient(options).start(app);
  }

  async start (app) {
    const server = this.server = new Server(app, {listen: ['http://*'], quiet: true});
    await server.start();
    if (this.baseURL === undefined) this.baseURL = server.urls[0];
    return this;
  }

  stop () {
    return this.server.stop();
  }
}
