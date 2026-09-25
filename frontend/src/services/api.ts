const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${response.status}`);
  }
  return json.data as T;
}

const get = <T>(path: string) => request<T>(path);

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${response.status}`);
  }
  return json.data as T;
}

export const api = {
  get,
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, formData: FormData) =>
    requestForm<T>(path, formData),
  activityTrace: <T>(projectId: string, activityId: string) =>
    get<T>(`/projects/${encodeURIComponent(projectId)}/analytics/activity-trace/${encodeURIComponent(activityId)}`),
  byDisciplineStatus: <T>(projectId: string, discipline: string, status: string) =>
    get<T>(
      `/projects/${encodeURIComponent(projectId)}/analytics/by-discipline-status?discipline=${encodeURIComponent(discipline)}&status=${encodeURIComponent(status)}`,
    ),
  progressByDiscipline: <T>(projectId: string) =>
    get<T>(`/projects/${encodeURIComponent(projectId)}/analytics/progress-by-discipline`),
  recentUpdates: <T>(projectId: string, limit = 20) =>
    get<T>(`/projects/${encodeURIComponent(projectId)}/analytics/recent-updates?limit=${limit}`),
};
