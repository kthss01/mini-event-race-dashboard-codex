import contestsData from '../../data/contests.json';

type Contest = {
  id: string;
  name: string;
};

type ContestPayload = {
  meta: {
    generatedAt: string;
    version: number;
  };
  contests: Contest[];
};

export function getContestData(): ContestPayload {
  return contestsData as ContestPayload;
}
