const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface Channel {
  id: string
  name: string
  m3u8_url: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface Recording {
  id: string
  channel_id: string
  title: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'recording' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  channel?: Channel
}

export interface RecordedFile {
  id: string
  recording_id: string
  file_path: string
  file_size: number | null
  created_at: string
  recording?: Recording
}

export interface TimeConversion {
  channel_timezone: string
  channel_start_time: string
  channel_end_time: string
  utc_start_time: string
  utc_end_time: string
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }
  
  if (res.status === 204) {
    return null as T
  }
  
  return res.json()
}

// Channels API
export const channelsApi = {
  list: () => fetchApi<Channel[]>('/api/channels'),
  get: (id: string) => fetchApi<Channel>(`/api/channels/${id}`),
  create: (data: Omit<Channel, 'id' | 'created_at' | 'updated_at'>) => 
    fetchApi<Channel>('/api/channels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Channel>) => 
    fetchApi<Channel>(`/api/channels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    fetchApi<void>(`/api/channels/${id}`, { method: 'DELETE' }),
  timezones: () => fetchApi<string[]>('/api/channels/timezones/list'),
}

// Recordings API
export const recordingsApi = {
  list: (params?: { channel_id?: string; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.channel_id) searchParams.set('channel_id', params.channel_id)
    if (params?.status) searchParams.set('status', params.status)
    const query = searchParams.toString()
    return fetchApi<Recording[]>(`/api/recordings${query ? `?${query}` : ''}`)
  },
  get: (id: string) => fetchApi<Recording>(`/api/recordings/${id}`),
  create: (data: Omit<Recording, 'id' | 'status' | 'created_at' | 'channel'>) => 
    fetchApi<Recording>('/api/recordings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Recording>) => 
    fetchApi<Recording>(`/api/recordings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => 
    fetchApi<void>(`/api/recordings/${id}`, { method: 'DELETE' }),
  convertTime: (id: string) => 
    fetchApi<TimeConversion>(`/api/recordings/${id}/convert-time`),
}

// Files API
export const filesApi = {
  list: () => fetchApi<RecordedFile[]>('/api/files'),
  get: (id: string) => fetchApi<RecordedFile>(`/api/files/${id}`),
  delete: (id: string) => 
    fetchApi<void>(`/api/files/${id}`, { method: 'DELETE' }),
  downloadUrl: (id: string) => `${API_BASE}/api/files/${id}/download`,
}

