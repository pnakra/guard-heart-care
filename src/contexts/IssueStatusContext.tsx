import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type IssueStatus = 'unreviewed' | 'in-review' | 'fixed' | 'wont-fix' | 'accepted-risk';

export const ISSUE_STATUS_CONFIG: Record<IssueStatus, { label: string; color: string; dotClass: string }> = {
  'unreviewed': {
    label: 'Unreviewed',
    color: 'text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  'in-review': {
    label: 'In Review',
    color: 'text-[hsl(var(--ethics-low))]',
    dotClass: 'bg-[hsl(var(--ethics-low))]',
  },
  'fixed': {
    label: 'Fixed',
    color: 'text-[hsl(var(--ethics-safe))]',
    dotClass: 'bg-[hsl(var(--ethics-safe))]',
  },
  'wont-fix': {
    label: "Won't Fix",
    color: 'text-muted-foreground/70',
    dotClass: 'bg-muted-foreground/70',
  },
  'accepted-risk': {
    label: 'Accepted Risk',
    color: 'text-[hsl(var(--ethics-medium))]',
    dotClass: 'bg-[hsl(var(--ethics-medium))]',
  },
};

/** Statuses that count as "reviewed" for triage progress */
export const REVIEWED_STATUSES: IssueStatus[] = ['in-review', 'fixed', 'wont-fix', 'accepted-risk'];

/** Statuses that should be excluded from GFS calculation */
export const GFS_EXCLUDED_STATUSES: IssueStatus[] = ['wont-fix', 'accepted-risk'];

interface IssueStatusContextValue {
  getStatus: (issueId: string) => IssueStatus;
  setStatus: (issueId: string, status: IssueStatus) => void;
  getAllStatuses: () => Record<string, IssueStatus>;
  /** Carry forward statuses from previous scan for matching IDs */
  carryForward: (newIssueIds: string[]) => void;
}

const IssueStatusContext = createContext<IssueStatusContextValue | null>(null);

export function IssueStatusProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, IssueStatus>>({});

  const getStatus = useCallback(
    (issueId: string): IssueStatus => statuses[issueId] || 'unreviewed',
    [statuses]
  );

  const setStatus = useCallback((issueId: string, status: IssueStatus) => {
    setStatuses(prev => ({ ...prev, [issueId]: status }));
  }, []);

  const getAllStatuses = useCallback(() => statuses, [statuses]);

  const carryForward = useCallback((newIssueIds: string[]) => {
    setStatuses(prev => {
      const newStatuses: Record<string, IssueStatus> = {};
      const newIdSet = new Set(newIssueIds);
      // Keep statuses whose IDs still exist in the new scan
      for (const [id, status] of Object.entries(prev)) {
        if (newIdSet.has(id)) {
          newStatuses[id] = status;
        }
      }
      return newStatuses;
    });
  }, []);

  return (
    <IssueStatusContext.Provider value={{ getStatus, setStatus, getAllStatuses, carryForward }}>
      {children}
    </IssueStatusContext.Provider>
  );
}

export function useIssueStatus() {
  const ctx = useContext(IssueStatusContext);
  if (!ctx) throw new Error('useIssueStatus must be used within IssueStatusProvider');
  return ctx;
}
