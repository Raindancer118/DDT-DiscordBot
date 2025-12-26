import { definition as dhDefinition, handle as handleDh } from './dh.js';
import { definition as clearDefinition, handle as handleClear } from './clear.js';
import { definition as statusDefinition, handle as handleStatus } from './status.js';
import { definition as loginDefinition, handle as handleLogin } from './login.js';
import { definition as coinflipDefinition, handle as handleCoinflip } from './coinflip.js';
import { definition as rouletteDefinition, handle as handleRoulette } from './roulette.js';
import { definition as slotsDefinition, handle as handleSlots } from './slots.js';
import { definition as diceDefinition, handle as handleDice } from './dice.js';
import { definition as blackjackDefinition, handle as handleBlackjack } from './blackjack.js';
import { definition as pokerDefinition, handle as handlePoker } from './poker.js';
import { definition as baccaratDefinition, handle as handleBaccarat } from './baccarat.js';
import { definition as warDefinition, handle as handleWar } from './war.js';

export const commandDefinitions = [
  dhDefinition,
  clearDefinition,
  statusDefinition,
  loginDefinition,
  coinflipDefinition,
  rouletteDefinition,
  slotsDefinition,
  diceDefinition,
  blackjackDefinition,
  pokerDefinition,
  baccaratDefinition,
  warDefinition
];

export const commandHandlers = {
  dh: handleDh,
  clear: handleClear,
  status: handleStatus,
  login: handleLogin,
  coinflip: handleCoinflip,
  roulette: handleRoulette,
  slots: handleSlots,
  dice: handleDice,
  blackjack: handleBlackjack,
  poker: handlePoker,
  baccarat: handleBaccarat,
  war: handleWar
};
