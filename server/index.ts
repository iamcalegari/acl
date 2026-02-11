import { Server } from '../libs/server';
import { serverConfig } from './configs/server.config';

const apiServer = new Server();


apiServer.init(serverConfig).then(() => {
  apiServer.start();
});
