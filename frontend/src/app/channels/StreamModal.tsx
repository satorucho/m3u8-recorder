'use client'

import { useRef, useEffect, useState } from 'react'
import { Channel } from '@/lib/api'
import { X, Volume2, VolumeX, Maximize, AlertCircle, Loader2 } from 'lucide-react'
import Hls from 'hls.js'

interface StreamModalProps {
  isOpen: boolean
  onClose: () => void
  channel: Channel | null
}

export function StreamModal({ isOpen, onClose, channel }: StreamModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (!isOpen || !channel || !videoRef.current) {
      return
    }

    setError(null)
    setIsLoading(true)
    const video = videoRef.current

    const destroyHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    // Safari can play HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.m3u8_url
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false)
        video.play().catch(() => {
          // Autoplay blocked, user needs to interact
        })
      })
      video.addEventListener('error', () => {
        setError('ストリームの読み込みに失敗しました')
        setIsLoading(false)
      })
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          // Allow CORS
          xhr.withCredentials = false
        },
      })
      hlsRef.current = hls

      hls.loadSource(channel.m3u8_url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        video.play().catch(() => {
          // Autoplay blocked
        })
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('ネットワークエラー: ストリームに接続できません')
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('メディアエラー: 再生に失敗しました')
              hls.recoverMediaError()
              break
            default:
              setError('ストリームの再生に失敗しました')
              destroyHls()
              break
          }
          setIsLoading(false)
        }
      })
    } else {
      setError('お使いのブラウザはHLS再生に対応していません')
      setIsLoading(false)
    }

    return () => {
      destroyHls()
      video.src = ''
    }
  }, [isOpen, channel])

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const handleClose = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.src = ''
    }
    onClose()
  }

  if (!isOpen || !channel) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-semibold">{channel.name}</h2>
            <span className="text-sm text-zinc-500">LIVE</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <span className="text-sm text-zinc-400">ストリームを読み込み中...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <span className="text-red-400">{error}</span>
                <p className="text-sm text-zinc-500 max-w-md">
                  URL: {channel.m3u8_url}
                </p>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            controls
            autoPlay
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-3 bg-zinc-900/95 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
              title={isMuted ? 'ミュート解除' : 'ミュート'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFullscreen}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
              title="フルスクリーン"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stream URL */}
        <div className="px-4 py-3 bg-zinc-950/50 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 font-mono truncate" title={channel.m3u8_url}>
            {channel.m3u8_url}
          </p>
        </div>
      </div>
    </div>
  )
}

