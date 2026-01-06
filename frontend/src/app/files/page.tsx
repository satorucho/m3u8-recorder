'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { filesApi, RecordedFile } from '@/lib/api'
import { FolderOpen, Download, Trash2, FileVideo, HardDrive, Calendar } from 'lucide-react'
import { format } from 'date-fns'

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '不明'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export default function FilesPage() {
  const queryClient = useQueryClient()

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: filesApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: filesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })

  const handleDownload = (file: RecordedFile) => {
    window.open(filesApi.downloadUrl(file.id), '_blank')
  }

  const handleDelete = async (file: RecordedFile) => {
    if (confirm(`ファイル「${file.file_path}」を削除しますか？この操作は取り消せません。`)) {
      await deleteMutation.mutateAsync(file.id)
    }
  }

  const totalSize = files.reduce((acc, f) => acc + (f.file_size || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">録画ファイル</h1>
          <p className="text-zinc-500 mt-1">録画済みファイルの管理とダウンロード</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-4 py-2 rounded-lg">
          <HardDrive className="w-4 h-4" />
          <span>合計: {formatFileSize(totalSize)}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded-lg" />
            ))}
          </div>
        </div>
      ) : files.length > 0 ? (
        <div className="grid gap-4">
          {files.map((file) => (
            <div key={file.id} className="card hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {file.recording?.title || 'Unknown Recording'}
                    </h3>
                    <p className="text-sm text-zinc-500 font-mono mt-1">
                      {file.file_path}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        {formatFileSize(file.file_size)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(file.created_at), 'yyyy/MM/dd HH:mm')}
                      </span>
                      {file.recording?.channel && (
                        <span className="text-zinc-500">
                          {file.recording.channel.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                    title="ダウンロード"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="削除"
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
          <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium">録画ファイルがありません</h3>
          <p className="text-zinc-500 mt-1">
            録画が完了するとここにファイルが表示されます
          </p>
        </div>
      )}
    </div>
  )
}

