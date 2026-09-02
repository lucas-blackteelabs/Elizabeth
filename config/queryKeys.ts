export const queryKeys = {
  household: { me: ['household', 'me'] as const },
  brief: { base: ['brief'] as const, script: ['brief', 'script'] as const },
  calendar: { events: ['calendar', 'events'] as const, reminders: ['calendar', 'reminders'] as const },
  chores: { base: ['chores'] as const },
  inbox: { signals: ['inbox', 'signals'] as const, samples: ['inbox', 'samples'] as const },
} as const;
