import { useContestData } from './lib/data';
import { RouterLink, useRoute, useRouter } from './lib/router';
import CalendarPage from './pages/CalendarPage';
import ContestDetailPage from './pages/ContestDetailPage';
import DashboardPage from './pages/DashboardPage';

const ROUTES = ['/', '/calendar', '/contest/:id'];

export default function App() {
  const { data, loading, error } = useContestData();
  const pathname = useRouter();
  const route = useRoute(pathname, ROUTES);

  return (
    <>
      <header className="app-header">
        <nav>
          <RouterLink to="/">Dashboard</RouterLink>
          <RouterLink to="/calendar">Calendar</RouterLink>
        </nav>
      </header>

      {loading ? (
        <main>
          <p>대회 데이터를 불러오는 중...</p>
        </main>
      ) : null}

      {error ? (
        <main>
          <p className="error">{error}</p>
        </main>
      ) : null}

      {!loading && data ? (
        <>
          {route.path === '/' ? <DashboardPage contests={data.contests} /> : null}
          {route.path === '/calendar' ? <CalendarPage contests={data.contests} /> : null}
          {route.path === '/contest/:id' ? (
            <ContestDetailPage contests={data.contests} contestId={route.params.id} />
          ) : null}
        </>
      ) : null}
    </>
  );
}
