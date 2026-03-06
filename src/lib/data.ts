import { useEffect, useState } from 'react';
import type { ContestsFile } from './types';

type ContestDataState = {
  data: ContestsFile | null;
  loading: boolean;
  error: string | null;
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

export function useContestData(): ContestDataState {
  const [state, setState] = useState<ContestDataState>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let active = true;

    loadContestData()
      .then((data) => {
        if (active) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (active) {
          setState({ data: EMPTY_DATA, loading: false, error: error.message });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
