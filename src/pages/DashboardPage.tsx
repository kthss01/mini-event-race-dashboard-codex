import { useMemo, useState } from 'react';
import ContestCard from '../components/ContestCard';
import Filters, { type FiltersValue } from '../components/Filters';
import type { Contest } from '../lib/types';

type DashboardPageProps = {
  contests: Contest[];
};

function within30Days(contest: Contest) {
  const today = new Date();
  const target = new Date(contest.date);
  const diff = target.getTime() - today.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

function matchesFilters(contest: Contest, filters: FiltersValue) {
  if (filters.sport !== 'all' && (contest.sport ?? '기타') !== filters.sport) {
    return false;
  }

  if (filters.status !== 'all' && contest.status !== filters.status) {
    return false;
  }

  if (filters.hideCancelledNoShow && (contest.status === 'cancelled' || contest.status === 'no_show')) {
    return false;
  }

  if (filters.query && !contest.name.toLowerCase().includes(filters.query.toLowerCase())) {
    return false;
  }

  return true;
}

export default function DashboardPage({ contests }: DashboardPageProps) {
  const [filters, setFilters] = useState<FiltersValue>({
    sport: 'all',
    status: 'all',
    hideCancelledNoShow: false,
    query: '',
  });

  const sports = useMemo(() => {
    return [...new Set(contests.map((contest) => contest.sport ?? '기타'))].sort((a, b) => a.localeCompare(b));
  }, [contests]);

  const filtered = useMemo(() => contests.filter((contest) => matchesFilters(contest, filters)), [contests, filters]);

  const upcoming = useMemo(
    () => filtered.filter(within30Days).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filtered]
  );

  return (
    <main>
      <h1>Mini Event Race Dashboard</h1>
      <p>다가오는 30일 대회를 확인하세요.</p>
      <Filters value={filters} sports={sports} onChange={setFilters} />

      <section>
        <h2>다가오는 30일</h2>
        {upcoming.length === 0 ? <p>조건에 맞는 대회가 없습니다.</p> : null}
        <div className="contest-grid">
          {upcoming.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      </section>
    </main>
  );
}
