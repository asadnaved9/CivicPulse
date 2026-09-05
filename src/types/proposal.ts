export type ProposalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'funded'
  | 'in_execution'
  | 'verified'
  | 'completed'
  | 'rejected';

export interface StatusHistoryEntry {
  status: ProposalStatus;
  changedAt: any;
  changedBy?: string;
  note?: string;
}

export interface Proposal {
  id: string;
  recommendationId: string;      // FK → recommendations/{id}
  title: string;
  status: ProposalStatus;
  statusHistory: StatusHistoryEntry[];
  proposalText: string;          // output of /api/mp/generate-proposal
  estimatedCost: string;
  matchedScheme?: string;        // from scheme-matcher, once run
  category?: string;
  location?: string;
  createdAt: any;
  updatedAt: any;
}
