import CalendarView from '../components/CalendarView';
import type { Contest } from '../lib/types';

type CalendarPageProps = {
  contests: Contest[];
};

export default function CalendarPage({ contests }: CalendarPageProps) {
  return (
    <main>
      <h1>Contest Calendar</h1>
      <p>날짜별 대회를 선택해 상세 페이지로 이동하세요.</p>
      <CalendarView contests={contests} />
    </main>
  );
}
