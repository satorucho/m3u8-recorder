'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recordingsApi, Channel, Recording } from '@/lib/api'
import { X, Globe, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  recording: Recording | null
  channels: Channel[]
}

export function RecordingModal({ isOpen, onClose, recording, channels }: RecordingModalProps) {
  const queryClient = useQueryClient()
  const [channelId, setChannelId] = useState('')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [useChannelTimezone, setUseChannelTimezone] = useState(true)
  const [error, setError] = useState('')

  const selectedChannel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId]
  )

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const activeTimezone = useChannelTimezone && selectedChannel 
    ? selectedChannel.timezone 
    : browserTimezone

  useEffect(() => {
    if (recording) {
      setChannelId(recording.channel_id)
      setTitle(recording.title)
      
      // Convert UTC to local display
      const startUtc = new Date(recording.start_time)
      const endUtc = new Date(recording.end_time)
      
      const channel = channels.find(c => c.id === recording.channel_id)
      const tz = channel?.timezone || browserTimezone
      
      setStartDate(formatInTimeZone(startUtc, tz, 'yyyy-MM-dd'))
      setStartTime(formatInTimeZone(startUtc, tz, 'HH:mm'))
      setEndDate(formatInTimeZone(endUtc, tz, 'yyyy-MM-dd'))
      setEndTime(formatInTimeZone(endUtc, tz, 'HH:mm'))
    } else {
      setChannelId(channels[0]?.id || '')
      setTitle('')
      const now = new Date()
      setStartDate(format(now, 'yyyy-MM-dd'))
      setStartTime(format(now, 'HH:mm'))
      setEndDate(format(now, 'yyyy-MM-dd'))
      setEndTime(format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm'))
    }
    setError('')
  }, [recording, isOpen, channels, browserTimezone])

  const createMutation = useMutation({
    mutationFn: recordingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Recording> }) =>
      recordingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] })
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const convertToUtc = (date: string, time: string): string => {
    const localDateTimeStr = `${date}T${time}:00`
    const utcDate = fromZonedTime(localDateTimeStr, activeTimezone)
    return utcDate.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!channelId || !title.trim() || !startDate || !startTime || !endDate || !endTime) {
      setError('すべての項目を入力してください')
      return
    }

    const startTimeUtc = convertToUtc(startDate, startTime)
    const endTimeUtc = convertToUtc(endDate, endTime)

    if (new Date(endTimeUtc) <= new Date(startTimeUtc)) {
      setError('終了時刻は開始時刻より後にしてください')
      return
    }

    if (recording) {
      await updateMutation.mutateAsync({
        id: recording.id,
        data: { title, start_time: startTimeUtc, end_time: endTimeUtc },
      })
    } else {
      await createMutation.mutateAsync({
        channel_id: channelId,
        title,
        start_time: startTimeUtc,
        end_time: endTimeUtc,
      })
    }
  }

  // Calculate browser time preview
  const getPreviewTime = () => {
    if (!startDate || !startTime || !endDate || !endTime) return null
    
    try {
      const startUtc = convertToUtc(startDate, startTime)
      const endUtc = convertToUtc(endDate, endTime)
      
      return {
        start: formatInTimeZone(new Date(startUtc), browserTimezone, 'yyyy/MM/dd HH:mm'),
        end: formatInTimeZone(new Date(endUtc), browserTimezone, 'yyyy/MM/dd HH:mm'),
      }
    } catch {
      return null
    }
  }

  const previewTime = getPreviewTime()

  if (!isOpen) return null

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">
            {recording ? '録画予約編集' : '録画予約作成'}
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
            <label className="label">チャンネル</label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="input"
              disabled={isLoading || !!recording}
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name} ({channel.timezone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ニュース9"
              className="input"
              disabled={isLoading}
            />
          </div>

          <div className="p-4 bg-zinc-800/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Globe className="w-4 h-4" />
                <span>タイムゾーン設定</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseChannelTimezone(true)}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    useChannelTimezone
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  チャンネル ({selectedChannel?.timezone || 'N/A'})
                </button>
                <button
                  type="button"
                  onClick={() => setUseChannelTimezone(false)}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    !useChannelTimezone
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  ブラウザ ({browserTimezone})
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              入力時刻は {activeTimezone} として解釈されます
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">開始日</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">開始時刻</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">終了日</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">終了時刻</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input"
                disabled={isLoading}
              />
            </div>
          </div>

          {previewTime && useChannelTimezone && selectedChannel?.timezone !== browserTimezone && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-indigo-400 mb-2">
                <Clock className="w-4 h-4" />
                <span>ブラウザ時間での表示 ({browserTimezone})</span>
              </div>
              <p className="text-sm text-zinc-300">
                {previewTime.start} - {previewTime.end}
              </p>
            </div>
          )}

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
              {isLoading ? '保存中...' : recording ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

