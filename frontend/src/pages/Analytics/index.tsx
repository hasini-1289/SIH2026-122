import React, { useState } from 'react';
import { BarChart3, Play } from 'lucide-react';
import { api } from '../../services/api';
import { useProjectId } from '../../hooks/useProject';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/LoadingSkeleton';

type QueryKind = 'activityTrace' | 'disciplineStatus' | 'progressByDiscipline' | 'recentUpdates';

type AnalyticsRow = Record<string, unknown>;

const QUERY_OPTIONS: Array<{ value: QueryKind; label: string }> = [
  { value: 'activityTrace', label: 'Activity trace' },
  { value: 'disciplineStatus', label: 'Filter by discipline and status' },
  { value: 'progressByDiscipline', label: 'Average progress by discipline' },
  { value: 'recentUpdates', label: 'Recent updates' },
];

const DISCIPLINES = ['Civil', 'Electrical', 'Instrumentation', 'Mechanical', 'Piping'];
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

const COLUMNS: Record<QueryKind, Array<{ key: string; label: string }>> = {
  activityTrace: [
    { key: 'update_id', label: 'Update' },
    { key: 'report_id', label: 'Report' },
    { key: 'activity_id', label: 'Activity' },
    { key: 'discipline', label: 'Discipline' },
    { key: 'prev_status', label: 'Previous' },
    { key: 'new_status', label: 'New status' },
    { key: 'prev_progress', label: 'Prev. progress' },
    { key: 'new_progress', label: 'New progress' },
    { key: 'message', label: 'Message' },
    { key: 'created_at', label: 'Created' },
  ],
  disciplineStatus: [
    { key: 'activity_id', label: 'Activity' },
    { key: 'report_id', label: 'Report' },
    { key: 'discipline', label: 'Discipline' },
    { key: 'new_status', label: 'Status' },
    { key: 'new_progress', label: 'Progress' },
    { key: 'message', label: 'Message' },
    { key: 'created_at', label: 'Created' },
  ],
  progressByDiscipline: [
    { key: 'discipline', label: 'Discipline' },
    { key: 'update_count', label: 'Updates' },
    { key: 'avg_progress', label: 'Average progress' },
  ],
  recentUpdates: [
    { key: 'update_id', label: 'Update' },
    { key: 'report_id', label: 'Report' },
    { key: 'activity_id', label: 'Activity' },
    { key: 'discipline', label: 'Discipline' },
    { key: 'new_status', label: 'Status' },
    { key: 'new_progress', label: 'Progress' },
    { key: 'message', label: 'Message' },
    { key: 'created_at', label: 'Created' },
  ],
};

function formatValue(value: unknown, key: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key.endsWith('progress') || key === 'avg_progress') {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toFixed(1)}%` : String(value);
  }
  if (key === 'decision_reasons') {
    try {
      const reasons = JSON.parse(String(value)) as unknown;
      return Array.isArray(reasons) ? reasons.join('; ') || '—' : String(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function Analytics() {
  const projectId = useProjectId();
  const [queryKind, setQueryKind] = useState<QueryKind>('activityTrace');
  const [activityId, setActivityId] = useState('CIV-001');
  const [discipline, setDiscipline] = useState(DISCIPLINES[0]);
  const [status, setStatus] = useState('COMPLETED');
  const [limit, setLimit] = useState('20');
  const [rows, setRows] = useState<AnalyticsRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      let result: AnalyticsRow[];
      if (queryKind === 'activityTrace') {
        result = await api.activityTrace<AnalyticsRow[]>(projectId, activityId.trim());
      } else if (queryKind === 'disciplineStatus') {
        result = await api.byDisciplineStatus<AnalyticsRow[]>(projectId, discipline, status);
      } else if (queryKind === 'progressByDiscipline') {
        result = await api.progressByDiscipline<AnalyticsRow[]>(projectId);
      } else {
        result = await api.recentUpdates<AnalyticsRow[]>(projectId, Number(limit) || 20);
      }
      setRows(result);
    } catch (err) {
      setRows(null);
      setError(err instanceof Error ? err.message : 'Unable to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = COLUMNS[queryKind];

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <span className="page-number">05 / ANALYTICS</span>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-on-dark-heading">
          PROGRESS ANALYTICS
          <BarChart3 size={25} className="text-accent-teal" />
        </h1>
      </header>

      <section className="glass-panel p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted block mb-2">
              Question template
            </span>
            <select
              value={queryKind}
              onChange={(event) => {
                setQueryKind(event.target.value as QueryKind);
                setRows(null);
                setError(null);
              }}
              className="glass-input w-full px-3 py-2.5 text-sm"
            >
              {QUERY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            onClick={runQuery}
            disabled={isLoading || (queryKind === 'activityTrace' && !activityId.trim())}
            className="glass-button-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <Play size={14} /> RUN
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {queryKind === 'activityTrace' && (
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted block mb-2">
                Activity ID
              </span>
              <input
                value={activityId}
                onChange={(event) => setActivityId(event.target.value)}
                className="glass-input w-full px-3 py-2.5 text-sm"
                placeholder="CIV-001"
              />
            </label>
          )}

          {queryKind === 'disciplineStatus' && (
            <>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted block mb-2">
                  Discipline
                </span>
                <select
                  value={discipline}
                  onChange={(event) => setDiscipline(event.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  {DISCIPLINES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted block mb-2">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  {STATUSES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </>
          )}

          {queryKind === 'recentUpdates' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted block mb-2">
                Number of updates
              </span>
              <input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                className="glass-input w-full px-3 py-2.5 text-sm"
              />
            </label>
          )}
        </div>
      </section>

      {isLoading ? (
        <SkeletonTable />
      ) : error ? (
        <EmptyState title="Unable to load analytics" description={error} action={{ label: 'Try Again', onClick: runQuery }} />
      ) : rows === null ? (
        <EmptyState
          icon={<BarChart3 size={40} className="text-accent-teal" />}
          title="Run an analytics query"
          description="Choose a template and parameters to inspect the progress history."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={40} className="text-accent-teal" />}
          title="No results found"
          description="Try a different activity, discipline, or status."
        />
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${String(row.update_id || row.activity_id || row.discipline || index)}-${index}`} className="glass-table-row">
                  {columns.map((column) => (
                    <td key={column.key} className="text-secondary max-w-[280px] truncate">
                      {formatValue(row[column.key], column.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
