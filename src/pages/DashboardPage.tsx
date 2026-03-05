import ContestList from '../components/ContestList';
import { getContestData } from '../lib/data';

export default function DashboardPage() {
  const data = getContestData();

  return (
    <main>
      <h1>Mini Event Race Dashboard</h1>
      <p>Ready for data pipeline integration.</p>
      <ContestList contests={data.contests} />
    </main>
  );
}
