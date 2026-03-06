import type { ContestStatus } from '../lib/types';

type StatusBadgeProps = {
  status: ContestStatus;
};

const STATUS_LABELS: Record<ContestStatus, string> = {
  registration_open: '접수중',
  registration_closed: '접수마감',
  paid: '결제완료',
  refunded: '환불',
  cancelled: '취소',
  no_show: '불참',
  not_applied: '미신청',
  scheduled: '예정',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}
