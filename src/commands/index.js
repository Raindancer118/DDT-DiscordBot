import { definition as dhDefinition, handle as handleDh } from './dh.js';
import { definition as clearDefinition, handle as handleClear } from './clear.js';

export const commandDefinitions = [dhDefinition, clearDefinition];

export const commandHandlers = {
  dh: handleDh,
  clear: handleClear
};
