import { useMemo, useState } from 'react';
import ContestCard from '../components/ContestCard';
import Filters, { type FiltersValue } from '../components/Filters';
import type { Contest } from '../lib/types';

type DataNoticeMode = 'empty' | 'error';

type DashboardPageProps = {
  contests: Contest[];
  generatedAt: string;
  dataNoticeMode: DataNoticeMode | null;
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

  if (
    filters.hideCancelledNoShow &&
    (contest.status === 'cancelled' || contest.status === 'no_show')
  ) {
    return false;
  }

  if (filters.query && !contest.name.toLowerCase().includes(filters.query.toLowerCase())) {
    return false;
  }

  return true;
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '알 수 없음';
  }

  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

export default function DashboardPage({
  contests,
  generatedAt,
  dataNoticeMode
}: DashboardPageProps) {
  const [filters, setFilters] = useState<FiltersValue>({
    sport: 'all',
    status: 'all',
    hideCancelledNoShow: false,
    query: ''
  });

  const sports = useMemo(() => {
    return [...new Set(contests.map((contest) => contest.sport ?? '기타'))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [contests]);

  const filtered = useMemo(
    () => contests.filter((contest) => matchesFilters(contest, filters)),
    [contests, filters]
  );

  const upcoming = useMemo(
    () =>
      filtered
        .filter(within30Days)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filtered]
  );

  const allContests = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered]
  );

  const userNotice =
    dataNoticeMode === 'error'
      ? '대회 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'
      : '등록된 대회 일정이 아직 없습니다.';

  const adminNotice =
    dataNoticeMode === 'error'
      ? '수집/파싱 파이프라인 실패 가능성이 있습니다. 데이터 소스와 배치 로그를 확인해 주세요.'
      : '빈 일정 상태입니다. 신규 문서 반영 후 데이터를 다시 생성해 주세요.';

  return (
    <main>
      <h1>Mini Event Race Dashboard</h1>
      <p>다가오는 30일 대회를 확인하세요.</p>
      <p className="meta-text">마지막 데이터 갱신: {formatGeneratedAt(generatedAt)}</p>

      {dataNoticeMode ? (
        <section className="data-notice" aria-live="polite">
          <h2>데이터 없음</h2>
          <p>{userNotice}</p>
          <p className="admin-hint">
            운영자 힌트: {adminNotice} 마지막 갱신 시점은 {formatGeneratedAt(generatedAt)}입니다.{' '}
            <a href="/data-refresh-guide.html" target="_blank" rel="noreferrer">
              갱신 방법 보기
            </a>
          </p>
        </section>
      ) : null}

      <Filters value={filters} sports={sports} onChange={setFilters} />

      <section>
        <h2>다가오는 30일</h2>
        {!dataNoticeMode && upcoming.length === 0 ? <p>조건에 맞는 대회가 없습니다.</p> : null}
        <div className="contest-grid">
          {upcoming.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      </section>

      {!dataNoticeMode ? (
        <section>
          <h2>전체 대회 ({allContests.length})</h2>
          {allContests.length === 0 ? <p>조건에 맞는 대회가 없습니다.</p> : null}
          <div className="contest-grid">
            {allContests.map((contest) => (
              <ContestCard key={`all-${contest.id}`} contest={contest} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
