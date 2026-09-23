// Fixed rules of the competition — no admin UI, no per-month config on purpose.
export const COMPETITION_START = '2026-10-01';
export const COMPETITION_END = '2026-10-31';
export const TIMEZONE = 'America/Bogota';

// Check-in window: opens 18:00, closes 04:00 the following calendar day.
export const WINDOW_START_HOUR = 18;
export const WINDOW_END_HOUR = 4;
// Local hour for the "racha en peligro" urgent nudge — comfortably before WINDOW_END_HOUR.
export const URGENT_REMINDER_HOUR = 2;

export const USER_IDS = ['jugador1', 'jugador2', 'jugador3'];
export const USER_LABELS = {
  jugador1: 'Jugador 1',
  jugador2: 'Jugador 2',
  jugador3: 'Jugador 3',
};

export const STATUS = {
  CLEAN: 'clean',
  RELAPSE: 'relapse',
  NO_REPORTADO: 'no_reportado',
};

export const TRIGGER_TAGS = ['estres', 'aburrimiento', 'social', 'ansiedad', 'otro'];
export const TRIGGER_LABELS = {
  estres: 'Estrés',
  aburrimiento: 'Aburrimiento',
  social: 'Social',
  ansiedad: 'Ansiedad',
  otro: 'Otro',
};

export const MAX_NOTE_LENGTH = 280;
export const MILESTONES = [7, 14, 21, 31];
export const SESSION_DURATION_DAYS = 45;

export const CLEAN_PHRASES = [
  '🔥 Otro día en la bolsa. Así se hace.',
  '💪 Sin pecado hoy. Tu yo de mañana te lo agradece.',
  '🧠 Neurona salvada. Sigue así.',
  '⏳ Otra hora de vida recuperada.',
  '🏆 Racha intacta. Que no se rompa.',
  '✨ Limpio otra vez. Vas muy bien.',
];

export const RELAPSE_PHRASES = [
  'Anotado. Mañana es otra noche — lo que importa es que sigas marcando.',
  'Pasó. Lo honesto ya vale más que lo perfecto. Seguimos mañana.',
  'Un día no define el mes. Vuelve a intentarlo esta noche.',
];
