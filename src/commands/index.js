import { definition as dhDefinition, handle as handleDh } from './dh.js';
import { definition as clearDefinition, handle as handleClear } from './clear.js';
import { definition as statusDefinition, handle as handleStatus } from './status.js';
import { definition as loginDefinition, handle as handleLogin } from './login.js';
import { definition as coinflipDefinition, handle as handleCoinflip } from './coinflip.js';

export const commandDefinitions = [dhDefinition, clearDefinition, statusDefinition, loginDefinition, coinflipDefinition];

export const commandHandlers = {
  dh: handleDh,
  clear: handleClear,
  status: handleStatus,
  login: handleLogin,
  coinflip: handleCoinflip
};
