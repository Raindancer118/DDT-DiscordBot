import { definition as dhDefinition, handle as handleDh } from './dh.js';
import { definition as clearDefinition, handle as handleClear } from './clear.js';
import { definition as statusDefinition, handle as handleStatus } from './status.js';

export const commandDefinitions = [dhDefinition, clearDefinition, statusDefinition];

export const commandHandlers = {
  dh: handleDh,
  clear: handleClear,
  status: handleStatus
};
