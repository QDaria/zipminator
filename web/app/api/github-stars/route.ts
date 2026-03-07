import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const REPO_OWNER = 'MoHoushmand'
const REPO_NAME = 'zipminator-pqc'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ starred: false, error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Check if the user has starred the repo using GitHub API
    // The user's GitHub access token is available via the OAuth session
    const token = (session as any).accessToken

    if (!token) {
      return NextResponse.json({
        starred: false,
        error: 'No GitHub access token. Sign in with GitHub first.',
      })
    }

    const res = await fetch(
      `https://api.github.com/user/starred/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )

    // 204 = starred, 404 = not starred
    const starred = res.status === 204

    // Get star count
    const repoRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      }
    )
    const repoData = repoRes.ok ? await repoRes.json() : null
    const starCount = repoData?.stargazers_count ?? 0

    return NextResponse.json({
      starred,
      starCount,
      activationCode: starred ? 'GHSTAR-LEVEL5' : null,
      user: session.user.name,
    })
  } catch (error) {
    return NextResponse.json(
      { starred: false, error: 'Failed to check star status' },
      { status: 500 }
    )
  }
}
