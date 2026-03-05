type Contest = {
  id: string;
  name: string;
};

type ContestListProps = {
  contests: Contest[];
};

export default function ContestList({ contests }: ContestListProps) {
  if (contests.length === 0) {
    return <p>No contests yet.</p>;
  }

  return (
    <ul>
      {contests.map((contest) => (
        <li key={contest.id}>{contest.name}</li>
      ))}
    </ul>
  );
}
