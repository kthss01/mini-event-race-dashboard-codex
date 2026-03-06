import { RouterLink } from '../lib/router';
import type { Contest } from '../lib/types';
import StatusBadge from './StatusBadge';

type ContestCardProps = {
  contest: Contest;
};

function formatRange(start: string, end?: string) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString();
  }

  return `${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`;
}

export default function ContestCard({ contest }: ContestCardProps) {
  return (
    <article className="contest-card">
      <div className="contest-card-header">
        <h3>
          <RouterLink to={`/contest/${contest.id}`}>{contest.name}</RouterLink>
        </h3>
        <StatusBadge status={contest.status} />
      </div>
      <p className="contest-meta">{contest.sport ?? '기타'} · {formatRange(contest.date, contest.endDate)}</p>
      {contest.notes.length > 0 ? <p className="contest-note">{contest.notes[0]}</p> : null}
    </article>
  );
}
