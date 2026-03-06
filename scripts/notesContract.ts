import type { NoteItem, NotesFile } from '../src/lib/types';

type LegacyNotesFile = {
  meta?: {
    generatedAt?: string;
    version?: number;
  };
  notes?: string[];
};

function isNoteItem(value: unknown): value is NoteItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const note = value as Record<string, unknown>;
  return (
    typeof note.id === 'string' &&
    typeof note.message === 'string' &&
    (note.source === 'parse' || note.source === 'enrich' || note.source === 'migration') &&
    typeof note.createdAt === 'string' &&
    (typeof note.contestId === 'undefined' || typeof note.contestId === 'string')
  );
}

export function normalizeNotesFile(input: unknown, fallbackGeneratedAt: string): NotesFile {
  if (typeof input !== 'object' || input === null) {
    return {
      meta: {
        generatedAt: fallbackGeneratedAt,
        version: 1
      },
      notes: []
    };
  }

  const file = input as Record<string, unknown>;
  const meta = (file.meta as Record<string, unknown> | undefined) ?? {};
  const generatedAt = typeof meta.generatedAt === 'string' ? meta.generatedAt : fallbackGeneratedAt;

  if (Array.isArray(file.notes) && file.notes.every(isNoteItem)) {
    return {
      meta: {
        generatedAt,
        version: 1
      },
      notes: file.notes
    };
  }

  const legacy = input as LegacyNotesFile;

  if (Array.isArray(legacy.notes) && legacy.notes.every((note) => typeof note === 'string')) {
    return {
      meta: {
        generatedAt,
        version: 1
      },
      notes: legacy.notes.map((message, index) => ({
        id: `migration-note-${index + 1}`,
        message,
        source: 'migration',
        createdAt: generatedAt
      }))
    };
  }

  return {
    meta: {
      generatedAt,
      version: 1
    },
    notes: []
  };
}
