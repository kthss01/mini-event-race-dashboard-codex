import { RouterLink } from '../lib/router';
import type { Contest } from '../lib/types';
import StatusBadge from './StatusBadge';

type CalendarViewProps = {
  contests: Contest[];
};

function toKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10);
}

export default function CalendarView({ contests }: CalendarViewProps) {
  const grouped = contests.reduce<Record<string, Contest[]>>((acc, contest) => {
    const key = toKey(contest.date);
    acc[key] = acc[key] ?? [];
    acc[key].push(contest);
    return acc;
  }, {});

  const keys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  if (keys.length === 0) {
    return <p>표시할 대회가 없습니다.</p>;
  }

  return (
    <div className="calendar-list">
      {keys.map((key) => (
        <section key={key} className="calendar-day">
          <h3>{new Date(key).toLocaleDateString()}</h3>
          <ul>
            {grouped[key].map((contest) => (
              <li key={contest.id}>
                <RouterLink to={`/contest/${contest.id}`} className="calendar-badge">
                  {contest.name}
                </RouterLink>
                <StatusBadge status={contest.status} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
