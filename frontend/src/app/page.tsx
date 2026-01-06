'use client'

import { useQuery } from '@tanstack/react-query'
import { channelsApi, recordingsApi, filesApi, Recording } from '@/lib/api'
import { Radio, Calendar, FolderOpen, Activity } from 'lucide-react'
import Link from 'next/link'

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  href,
  color 
}: { 
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}) {
  return (
    <Link href={href}>
      <div className="card hover:border-zinc-700 transition-all cursor-pointer group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function RecordingStatusBadge({ status }: { status: Recording['status'] }) {
  const styles = {
    scheduled: 'status-badge status-scheduled',
    recording: 'status-badge status-recording',
    completed: 'status-badge status-completed',
    failed: 'status-badge status-failed',
    cancelled: 'status-badge status-cancelled',
  }
  
  const labels = {
    scheduled: '予約済み',
    recording: '録画中',
    completed: '完了',
    failed: '失敗',
    cancelled: 'キャンセル',
  }

  return (
    <span className={styles[status]}>
      {labels[status]}
    </span>
  )
}

export default function DashboardPage() {
  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
  })

  const { data: recordings = [] } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => recordingsApi.list(),
  })

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: filesApi.list,
  })

  const activeRecordings = recordings.filter(r => r.status === 'recording')
  const scheduledRecordings = recordings.filter(r => r.status === 'scheduled')
  const recentRecordings = recordings.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-zinc-500 mt-1">録画サーバーの概要</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="チャンネル"
          value={channels.length}
          icon={Radio}
          href="/channels"
          color="bg-indigo-500/20 text-indigo-400"
        />
        <StatCard
          title="録画中"
          value={activeRecordings.length}
          icon={Activity}
          href="/recordings?status=recording"
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          title="予約済み"
          value={scheduledRecordings.length}
          icon={Calendar}
          href="/recordings?status=scheduled"
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="録画ファイル"
          value={files.length}
          icon={FolderOpen}
          href="/files"
          color="bg-amber-500/20 text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">最近の録画予約</h2>
          {recentRecordings.length > 0 ? (
            <div className="space-y-3">
              {recentRecordings.map((recording) => (
                <div 
                  key={recording.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{recording.title}</p>
                    <p className="text-sm text-zinc-500">
                      {recording.channel?.name || 'Unknown Channel'}
                    </p>
                  </div>
                  <RecordingStatusBadge status={recording.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              録画予約はありません
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">登録チャンネル</h2>
          {channels.length > 0 ? (
            <div className="space-y-3">
              {channels.slice(0, 5).map((channel) => (
                <div 
                  key={channel.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-sm text-zinc-500 font-mono truncate max-w-xs">
                      {channel.m3u8_url}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                    {channel.timezone}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              チャンネルが登録されていません
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

