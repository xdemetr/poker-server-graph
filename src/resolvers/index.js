import { authResolver } from './authResolver.js';
import { playerResolver } from './playerResolver.js';
import { gameResolver } from './gameResolver.js';

const rootResolver = {
  ...authResolver,
  ...playerResolver,
  ...gameResolver,
};

export default rootResolver;
