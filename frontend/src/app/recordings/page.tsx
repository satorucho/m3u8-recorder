'use client'

import { Suspense, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recordingsApi, channelsApi, Recording } from '@/lib/api'
import { Plus, Pencil, Trash2, Calendar, Clock, Info } from 'lucide-react'
import { RecordingModal } from './RecordingModal'
import { TimeInfoModal } from './TimeInfoModal'
import { format } from 'date-fns'
import { useSearchParams } from 'next/navigation'

function StatusBadge({ status }: { status: Recording['status'] }) {
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

function RecordingsContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || ''
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null)
  const [timeInfoId, setTimeInfoId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState(statusFilter)

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings', filterStatus],
    queryFn: () => recordingsApi.list(filterStatus ? { status: filterStatus } : undefined),
  })

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: recordingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] })
    },
  })

  const handleEdit = (recording: Recording) => {
    if (recording.status !== 'scheduled') {
      alert('予約済みの録画のみ編集できます')
      return
    }
    setEditingRecording(recording)
    setModalOpen(true)
  }

  const handleDelete = async (recording: Recording) => {
    const action = recording.status === 'recording' ? 'キャンセル' : '削除'
    if (confirm(`録画「${recording.title}」を${action}しますか？`)) {
      await deleteMutation.mutateAsync(recording.id)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingRecording(null)
  }

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), 'yyyy/MM/dd HH:mm')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">録画予約</h1>
          <p className="text-zinc-500 mt-1">録画スケジュールの管理</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
          disabled={channels.length === 0}
        >
          <Plus className="w-5 h-5" />
          録画予約
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'scheduled', 'recording', 'completed', 'failed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {status === '' ? 'すべて' :
             status === 'scheduled' ? '予約済み' :
             status === 'recording' ? '録画中' :
             status === 'completed' ? '完了' :
             status === 'failed' ? '失敗' : 'キャンセル'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded-lg" />
            ))}
          </div>
        </div>
      ) : recordings.length > 0 ? (
        <div className="grid gap-4">
          {recordings.map((recording) => (
            <div key={recording.id} className="card hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{recording.title}</h3>
                      <StatusBadge status={recording.status} />
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {recording.channel?.name || 'Unknown Channel'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDateTime(recording.start_time)} - {formatDateTime(recording.end_time)}
                        </span>
                        <span className="text-zinc-600">(UTC)</span>
                      </div>
                      <button
                        onClick={() => setTimeInfoId(recording.id)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-all"
                      >
                        <Info className="w-3 h-3" />
                        タイムゾーン変換
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {recording.status === 'scheduled' && (
                    <button
                      onClick={() => handleEdit(recording)}
                      className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(recording)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium">録画予約がありません</h3>
          <p className="text-zinc-500 mt-1">
            {channels.length === 0
              ? '先にチャンネルを登録してください'
              : '「録画予約」ボタンから新しい予約を作成してください'}
          </p>
        </div>
      )}

      <RecordingModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        recording={editingRecording}
        channels={channels}
      />

      <TimeInfoModal
        recordingId={timeInfoId}
        onClose={() => setTimeInfoId(null)}
      />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">録画予約</h1>
          <p className="text-zinc-500 mt-1">録画スケジュールの管理</p>
        </div>
      </div>
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RecordingsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RecordingsContent />
    </Suspense>
  )
}
