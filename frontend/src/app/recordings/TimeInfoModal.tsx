'use client'

import { useQuery } from '@tanstack/react-query'
import { recordingsApi } from '@/lib/api'
import { X, Globe, Clock } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

interface TimeInfoModalProps {
  recordingId: string | null
  onClose: () => void
}

export function TimeInfoModal({ recordingId, onClose }: TimeInfoModalProps) {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { data: timeInfo, isLoading } = useQuery({
    queryKey: ['recording-time', recordingId],
    queryFn: () => recordingsApi.convertTime(recordingId!),
    enabled: !!recordingId,
  })

  if (!recordingId) return null

  const formatBrowserTime = (utcTime: string) => {
    return formatInTimeZone(new Date(utcTime), browserTimezone, 'yyyy/MM/dd HH:mm')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">タイムゾーン変換</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-zinc-800 rounded-lg" />
              <div className="h-20 bg-zinc-800 rounded-lg" />
              <div className="h-20 bg-zinc-800 rounded-lg" />
            </div>
          ) : timeInfo ? (
            <>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-indigo-400 mb-3">
                  <Globe className="w-4 h-4" />
                  <span>チャンネル時間帯 ({timeInfo.channel_timezone})</span>
                </div>
                <p className="text-lg font-medium">
                  {timeInfo.channel_start_time} - {timeInfo.channel_end_time}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-400 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>ブラウザ時間帯 ({browserTimezone})</span>
                </div>
                <p className="text-lg font-medium">
                  {formatBrowserTime(timeInfo.utc_start_time)} - {formatBrowserTime(timeInfo.utc_end_time)}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                  <span className="w-4 h-4 text-center font-mono text-xs">UTC</span>
                  <span>協定世界時</span>
                </div>
                <p className="text-lg font-medium font-mono">
                  {formatInTimeZone(new Date(timeInfo.utc_start_time), 'UTC', 'yyyy/MM/dd HH:mm')} - {formatInTimeZone(new Date(timeInfo.utc_end_time), 'UTC', 'HH:mm')}
                </p>
              </div>
            </>
          ) : (
            <p className="text-center text-zinc-500">データを取得できませんでした</p>
          )}
        </div>
      </div>
    </div>
  )
}

