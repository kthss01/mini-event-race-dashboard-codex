import type { ContestStatus } from '../lib/types';

type FiltersValue = {
  sport: string;
  status: ContestStatus | 'all';
  hideCancelledNoShow: boolean;
  query: string;
};

type FiltersProps = {
  value: FiltersValue;
  sports: string[];
  onChange: (next: FiltersValue) => void;
};

const STATUSES: Array<{ value: ContestStatus | 'all'; label: string }> = [
  { value: 'all', label: '전체 상태' },
  { value: 'registration_open', label: '접수중' },
  { value: 'registration_closed', label: '접수마감' },
  { value: 'paid', label: '결제완료' },
  { value: 'refunded', label: '환불' },
  { value: 'cancelled', label: '취소' },
  { value: 'no_show', label: '불참' },
  { value: 'not_applied', label: '미신청' },
  { value: 'scheduled', label: '예정' },
];

export type { FiltersValue };

export default function Filters({ value, sports, onChange }: FiltersProps) {
  return (
    <section className="filters">
      <label>
        종목
        <select value={value.sport} onChange={(event) => onChange({ ...value, sport: event.target.value })}>
          <option value="all">전체 종목</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </label>

      <label>
        상태
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as FiltersValue['status'] })}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <label className="search">
        제목 검색
        <input
          type="search"
          placeholder="대회명을 입력하세요"
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
        />
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.hideCancelledNoShow}
          onChange={(event) => onChange({ ...value, hideCancelledNoShow: event.target.checked })}
        />
        취소·불참 숨기기
      </label>
    </section>
  );
}
