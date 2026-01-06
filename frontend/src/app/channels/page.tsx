'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { channelsApi, Channel } from '@/lib/api'
import { Plus, Pencil, Trash2, Radio, Globe, Play } from 'lucide-react'
import { ChannelModal } from './ChannelModal'
import { StreamModal } from './StreamModal'

export default function ChannelsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [streamModalOpen, setStreamModalOpen] = useState(false)
  const [streamingChannel, setStreamingChannel] = useState<Channel | null>(null)

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: channelsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: channelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setModalOpen(true)
  }

  const handleDelete = async (channel: Channel) => {
    if (confirm(`チャンネル「${channel.name}」を削除しますか？`)) {
      await deleteMutation.mutateAsync(channel.id)
    }
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingChannel(null)
  }

  const handleStream = (channel: Channel) => {
    setStreamingChannel(channel)
    setStreamModalOpen(true)
  }

  const handleCloseStreamModal = () => {
    setStreamModalOpen(false)
    setStreamingChannel(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">チャンネル</h1>
          <p className="text-zinc-500 mt-1">m3u8 URLを登録して録画対象のチャンネルを管理</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          チャンネル追加
        </button>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-zinc-800 rounded-lg" />
            ))}
          </div>
        </div>
      ) : channels.length > 0 ? (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="card hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{channel.name}</h3>
                    <p className="text-sm text-zinc-500 font-mono mt-1 break-all">
                      {channel.m3u8_url}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Globe className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-400">{channel.timezone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStream(channel)}
                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                    title="ストリーミング視聴"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(channel)}
                    className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
                    title="編集"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(channel)}
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
          <Radio className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium">チャンネルがありません</h3>
          <p className="text-zinc-500 mt-1">
            「チャンネル追加」ボタンから最初のチャンネルを登録してください
          </p>
        </div>
      )}

      <ChannelModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        channel={editingChannel}
      />

      <StreamModal
        isOpen={streamModalOpen}
        onClose={handleCloseStreamModal}
        channel={streamingChannel}
      />
    </div>
  )
}

