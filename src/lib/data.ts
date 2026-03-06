import contestsData from '../../data/contests.json';
import type { ContestsFile } from './types';

export function getContestData(): ContestsFile {
  return contestsData as ContestsFile;
}
