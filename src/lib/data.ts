import { useEffect, useState } from 'react';
import type { ContestsFile } from './types';

export type ContestDataLoadState = 'ready' | 'empty' | 'error';

type ContestDataState = {
  data: ContestsFile | null;
  loading: boolean;
  error: string | null;
  loadState: ContestDataLoadState;
};

const EMPTY_DATA: ContestsFile = {
  meta: {
    generatedAt: new Date(0).toISOString(),
    version: 1
  },
  contests: []
};

function buildContestsUrl() {
  return new URL(
    'data/contests.json',
    window.location.origin + import.meta.env.BASE_URL
  ).toString();
}

export async function loadContestData(): Promise<ContestsFile> {
  const response = await fetch(buildContestsUrl());

  if (!response.ok) {
    throw new Error(`Failed to load contests.json (${response.status})`);
  }

  const payload = (await response.json()) as ContestsFile;

  if (!Array.isArray(payload.contests)) {
    throw new Error('Invalid contests payload: contests must be an array.');
  }

  return payload;
}

function resolveLoadState(data: ContestsFile): ContestDataLoadState {
  return data.contests.length === 0 ? 'empty' : 'ready';
}

export function useContestData(): ContestDataState {
  const [state, setState] = useState<ContestDataState>({
    data: null,
    loading: true,
    error: null,
    loadState: 'ready'
  });

  useEffect(() => {
    let active = true;

    loadContestData()
      .then((data) => {
        if (active) {
          setState({
            data,
            loading: false,
            error: null,
            loadState: resolveLoadState(data)
          });
        }
      })
      .catch((error: Error) => {
        if (active) {
          setState({
            data: EMPTY_DATA,
            loading: false,
            error: error.message,
            loadState: 'error'
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
