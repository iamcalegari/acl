import { Server } from './server';
import path from 'path';

const apiServer = new Server();
const apiPath = path.resolve(__dirname, '../api');
apiServer.init(apiPath).then(() => {
  apiServer.start();
});
