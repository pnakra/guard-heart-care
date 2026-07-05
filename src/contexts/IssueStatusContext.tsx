import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type IssueStatus = 'unreviewed' | 'in-review' | 'fixed' | 'wont-fix' | 'accepted-risk';

export const ISSUE_STATUS_CONFIG: Record<IssueStatus, {
  /** Technical label (dev mode) */
  label: string;
  /** Intent-language label for non-technical builders (vibe mode) */
  intentLabel: string;
  color: string;
  dotClass: string;
}> = {
  'unreviewed': {
    label: 'Unreviewed',
    intentLabel: 'Not reviewed yet',
    color: 'text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  'in-review': {
    label: 'In Review',
    intentLabel: "I'm looking into this",
    color: 'text-[hsl(var(--ethics-low))]',
    dotClass: 'bg-[hsl(var(--ethics-low))]',
  },
  'fixed': {
    label: 'Fixed',
    intentLabel: "I've fixed this",
    color: 'text-[hsl(var(--ethics-safe))]',
    dotClass: 'bg-[hsl(var(--ethics-safe))]',
  },
  'wont-fix': {
    label: "Won't Fix",
    intentLabel: "I'm leaving this as-is",
    color: 'text-muted-foreground/70',
    dotClass: 'bg-muted-foreground/70',
  },
  'accepted-risk': {
    label: 'Accepted Risk',
    intentLabel: 'This is intentional',
    color: 'text-[hsl(var(--ethics-medium))]',
    dotClass: 'bg-[hsl(var(--ethics-medium))]',
  },
};

/** Statuses that count as "reviewed" for triage progress */
export const REVIEWED_STATUSES: IssueStatus[] = ['in-review', 'fixed', 'wont-fix', 'accepted-risk'];

/** Statuses that should be excluded from GFS calculation */
export const GFS_EXCLUDED_STATUSES: IssueStatus[] = ['wont-fix', 'accepted-risk'];

/**
 * Statuses that mean "I'm deliberately setting this aside" — these discount the
 * score, so we require a one-line rationale to keep the triage decision honest.
 */
export const RATIONALE_REQUIRED_STATUSES: IssueStatus[] = ['wont-fix', 'accepted-risk'];

interface IssueStatusContextValue {
  getStatus: (issueId: string) => IssueStatus;
  /** Set status; pass a rationale to record why (required for set-aside statuses) */
  setStatus: (issueId: string, status: IssueStatus, rationale?: string) => void;
  getAllStatuses: () => Record<string, IssueStatus>;
  /** The one-line rationale recorded when an issue was set aside, if any */
  getRationale: (issueId: string) => string | undefined;
  getAllRationales: () => Record<string, string>;
  /** Carry forward statuses from previous scan for matching IDs */
  carryForward: (newIssueIds: string[]) => void;
}

const IssueStatusContext = createContext<IssueStatusContextValue | null>(null);

export function IssueStatusProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, IssueStatus>>({});
  const [rationales, setRationales] = useState<Record<string, string>>({});

  const getStatus = useCallback(
    (issueId: string): IssueStatus => statuses[issueId] || 'unreviewed',
    [statuses]
  );

  const setStatus = useCallback((issueId: string, status: IssueStatus, rationale?: string) => {
    setStatuses(prev => ({ ...prev, [issueId]: status }));
    setRationales(prev => {
      const trimmed = rationale?.trim();
      // Store the rationale for set-aside statuses; clear it when moving to a
      // status that doesn't carry a justification so stale reasons don't linger.
      if (trimmed) {
        return { ...prev, [issueId]: trimmed };
      }
      if (prev[issueId] === undefined) return prev;
      const next = { ...prev };
      delete next[issueId];
      return next;
    });
  }, []);

  const getAllStatuses = useCallback(() => statuses, [statuses]);

  const getRationale = useCallback(
    (issueId: string): string | undefined => rationales[issueId],
    [rationales]
  );

  const getAllRationales = useCallback(() => rationales, [rationales]);

  const carryForward = useCallback((newIssueIds: string[]) => {
    const newIdSet = new Set(newIssueIds);
    setStatuses(prev => {
      const newStatuses: Record<string, IssueStatus> = {};
      // Keep statuses whose IDs still exist in the new scan
      for (const [id, status] of Object.entries(prev)) {
        if (newIdSet.has(id)) {
          newStatuses[id] = status;
        }
      }
      return newStatuses;
    });
    setRationales(prev => {
      const kept: Record<string, string> = {};
      for (const [id, rationale] of Object.entries(prev)) {
        if (newIdSet.has(id)) {
          kept[id] = rationale;
        }
      }
      return kept;
    });
  }, []);

  return (
    <IssueStatusContext.Provider value={{ getStatus, setStatus, getAllStatuses, getRationale, getAllRationales, carryForward }}>
      {children}
    </IssueStatusContext.Provider>
  );
}

export function useIssueStatus() {
  const ctx = useContext(IssueStatusContext);
  if (!ctx) throw new Error('useIssueStatus must be used within IssueStatusProvider');
  return ctx;
}
