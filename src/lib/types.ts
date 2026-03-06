export type ContestStatus =
  | 'registration_open'
  | 'registration_closed'
  | 'paid'
  | 'refunded'
  | 'cancelled'
  | 'no_show'
  | 'not_applied'
  | 'scheduled';

export type Registration = {
  opens?: string;
  closes?: string;
  paymentDue?: string;
  refundedAt?: string;
  cancelledAt?: string;
  note?: string;
};

export type Links = {
  website?: string;
  registration?: string;
  results?: string;
};

export type Media = {
  poster?: string;
  thumbnail?: string;
};

export type Contest = {
  id: string;
  name: string;
  sport?: string;
  date: string;
  endDate?: string;
  status: ContestStatus;
  registration?: Registration;
  links?: Links;
  media?: Media;
  notes: string[];
  updatedAt: string;
};

export type ContestsFile = {
  meta: {
    generatedAt: string;
    version: number;
  };
  contests: Contest[];
};

export type NotesFile = {
  meta: {
    generatedAt: string;
    version: number;
  };
  notes: string[];
};
