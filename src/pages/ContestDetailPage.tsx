import { RouterLink } from '../lib/router';
import StatusBadge from '../components/StatusBadge';
import type { Contest } from '../lib/types';

type ContestDetailPageProps = {
  contests: Contest[];
  contestId?: string;
};

function formatRange(start: string, end?: string) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString();
  }

  return `${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`;
}

export default function ContestDetailPage({ contests, contestId }: ContestDetailPageProps) {
  const contest = contests.find((item) => item.id === contestId);

  if (!contest) {
    return (
      <main>
        <h1>대회를 찾을 수 없습니다.</h1>
        <RouterLink to="/">대시보드로 돌아가기</RouterLink>
      </main>
    );
  }

  const image = contest.media?.poster ?? contest.media?.thumbnail;

  return (
    <main>
      <p>
        <RouterLink to="/">← 대시보드</RouterLink>
      </p>
      <h1>{contest.name}</h1>
      <p>
        <strong>기간:</strong> {formatRange(contest.date, contest.endDate)}
      </p>
      <p>
        <strong>상태:</strong> <StatusBadge status={contest.status} />
      </p>
      <p>
        <strong>메모:</strong> {contest.notes.length > 0 ? contest.notes.join(' / ') : '메모 없음'}
      </p>

      {contest.links?.website ? (
        <p>
          <a href={contest.links.website} target="_blank" rel="noreferrer" className="button-link">
            공식 링크 열기
          </a>
        </p>
      ) : null}

      <section>
        <h2>이미지</h2>
        {image ? (
          <img src={image} alt={`${contest.name} poster`} className="contest-image" />
        ) : (
          <div className="image-placeholder">이미지 없음</div>
        )}
      </section>
    </main>
  );
}
