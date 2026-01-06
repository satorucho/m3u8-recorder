'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { channelsApi, Channel } from '@/lib/api'
import { X } from 'lucide-react'

interface ChannelModalProps {
  isOpen: boolean
  onClose: () => void
  channel: Channel | null
}

const COMMON_TIMEZONES = [
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'UTC',
]

export function ChannelModal({ isOpen, onClose, channel }: ChannelModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [m3u8Url, setM3u8Url] = useState('')
  const [timezone, setTimezone] = useState('Asia/Tokyo')
  const [error, setError] = useState('')

  const { data: allTimezones = [] } = useQuery({
    queryKey: ['timezones'],
    queryFn: channelsApi.timezones,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (channel) {
      setName(channel.name)
      setM3u8Url(channel.m3u8_url)
      setTimezone(channel.timezone)
    } else {
      setName('')
      setM3u8Url('')
      setTimezone('Asia/Tokyo')
    }
    setError('')
  }, [channel, isOpen])

  const createMutation = useMutation({
    mutationFn: channelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Channel> }) =>
      channelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !m3u8Url.trim()) {
      setError('名前とURLは必須です')
      return
    }

    if (channel) {
      await updateMutation.mutateAsync({
        id: channel.id,
        data: { name, m3u8_url: m3u8Url, timezone },
      })
    } else {
      await createMutation.mutateAsync({
        name,
        m3u8_url: m3u8Url,
        timezone,
      })
    }
  }

  if (!isOpen) return null

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">
            {channel ? 'チャンネル編集' : 'チャンネル追加'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">チャンネル名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: NHK総合"
              className="input"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label">M3U8 URL</label>
            <input
              type="url"
              value={m3u8Url}
              onChange={(e) => setM3u8Url(e.target.value)}
              placeholder="https://example.com/stream.m3u8"
              className="input font-mono text-sm"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label">タイムゾーン</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input"
              disabled={isLoading}
            >
              <optgroup label="よく使用">
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </optgroup>
              <optgroup label="すべて">
                {allTimezones
                  .filter((tz) => !COMMON_TIMEZONES.includes(tz))
                  .map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
              </optgroup>
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              このチャンネルの標準時間帯（番組表の時間帯）
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : channel ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

