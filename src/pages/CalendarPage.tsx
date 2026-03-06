import CalendarView from '../components/CalendarView';
import type { Contest } from '../lib/types';

type DataNoticeMode = 'empty' | 'error';

type CalendarPageProps = {
  contests: Contest[];
  generatedAt: string;
  dataNoticeMode: DataNoticeMode | null;
};

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '알 수 없음';
  }

  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

export default function CalendarPage({
  contests,
  generatedAt,
  dataNoticeMode
}: CalendarPageProps) {
  const userNotice =
    dataNoticeMode === 'error'
      ? '캘린더용 일정 데이터를 불러오지 못했습니다.'
      : '표시할 일정이 아직 없습니다.';

  const adminNotice =
    dataNoticeMode === 'error'
      ? '수집/파싱 실패 여부를 확인하고 데이터 생성 작업을 재실행해 주세요.'
      : '문서에 일정이 비어 있을 수 있습니다. 데이터 갱신 절차를 실행해 최신 상태를 반영해 주세요.';

  return (
    <main>
      <h1>Contest Calendar</h1>
      <p>날짜별 대회를 선택해 상세 페이지로 이동하세요.</p>
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

      <CalendarView contests={contests} />
    </main>
  );
}
