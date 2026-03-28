import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Music2 } from 'lucide-react'

export default function MusicButton() {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const audio = new Audio('/music/song.mp3')
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleCanPlay = () => setIsReady(true)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('canplaythrough', handleCanPlay)

    return () => {
      audio.pause()
      audio.currentTime = 0
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('canplaythrough', handleCanPlay)
    }
  }, [])

  const toggleMusic = async () => {
    try {
      if (!audioRef.current) return

      if (audioRef.current.paused) {
        await audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    } catch (error) {
      console.error('Eroare la redarea audio:', error)
    }
  }

  return (
    <button
      onClick={toggleMusic}
      className={`group fixed bottom-5 right-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full border border-white/20
      bg-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]
      transition-all duration-300 hover:scale-110 hover:bg-white/15 active:scale-95
      ${isPlaying ? 'ring-2 ring-fuchsia-400/60' : ''}`}
      aria-label={isPlaying ? 'Pune muzica pe pauză' : 'Pornește muzica'}
      title={isPlaying ? 'Pause music' : 'Play music'}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/80 via-purple-500/70 to-cyan-500/70 opacity-90" />
      
      {isPlaying && (
        <span className="absolute inset-0 rounded-full animate-ping bg-fuchsia-400/20" />
      )}

      <div className="relative flex items-center justify-center">
        <Music2
          size={16}
          className={`absolute -top-5 opacity-0 transition-all duration-300 group-hover:-top-6 group-hover:opacity-100 ${
            isPlaying ? 'text-fuchsia-100' : 'text-white/80'
          }`}
        />

        {isPlaying ? (
          <Pause size={24} className="text-white drop-shadow-md" />
        ) : (
          <Play size={24} className="ml-0.5 text-white drop-shadow-md" />
        )}
      </div>

      {!isReady && (
        <span className="absolute -bottom-8 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          Loading audio...
        </span>
      )}
    </button>
  )
}