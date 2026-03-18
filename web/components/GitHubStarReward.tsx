'use client'

import { useState } from 'react'
import { Star, ExternalLink, Linkedin, Check } from 'lucide-react'
import Image from 'next/image'

interface GitHubStarRewardProps {
  starCount?: number
  isStarred?: boolean
}

export default function GitHubStarReward({
  starCount = 0,
  isStarred = false,
}: GitHubStarRewardProps) {
  const [checking, setChecking] = useState(false)
  const [starred, setStarred] = useState(isStarred)

  const checkStar = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/github-stars')
      const data = await res.json()
      setStarred(data.starred ?? false)
    } catch {
      // Silently fail
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[#92400E]">
          <Image
            src="/logos/Z_black.png"
            alt="Zipminator"
            width={24}
            height={24}
            className="invert"
          />
        </div>
        <div>
          <h3 className="font-bold text-lg">Star Supporter Program</h3>
          <p className="text-sm text-gray-400">
            Unlock Developer features for free
          </p>
        </div>
      </div>

      {starred ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">
              Star Supporter — Developer features unlocked!
            </span>
          </div>

          <p className="text-sm text-gray-400">
            You have access to anonymization levels 1-5, PQC API, and 10 GB data
            processing. Activation code: <code className="text-amber-300">GHSTAR-LEVEL5</code>
          </p>

          <a
            href={`/api/linkedin-badge?starred=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5] hover:bg-[#006699] transition-colors text-sm font-medium"
          >
            <Linkedin className="w-4 h-4" />
            Share on LinkedIn
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Star our GitHub repository to unlock Developer tier features (normally
            $9/mo) for free:
          </p>

          <ul className="space-y-1 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400" /> Anonymization levels 1-5
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400" /> PQC API access
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400" /> 10 GB data limit
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400" /> Star Supporter badge
            </li>
          </ul>

          <div className="flex gap-3">
            <a
              href="https://github.com/QDaria/zipminator"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 transition-colors text-sm font-medium"
            >
              <Star className="w-4 h-4" />
              Star on GitHub
              {starCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs">
                  {starCount}
                </span>
              )}
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={checkStar}
              disabled={checking}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Verify Star'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
