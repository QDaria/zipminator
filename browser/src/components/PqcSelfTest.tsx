import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface SelfTestResult {
  passed: boolean
  keygen_ms: number
  encapsulate_ms: number
  decapsulate_ms: number
  shared_secret_match: boolean
  pk_size: number
  sk_size: number
  ct_size: number
}

export default function PqcSelfTest() {
  const [result, setResult] = useState<SelfTestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await invoke<SelfTestResult>('pqc_self_test')
      setResult(res)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-white/10">
      <h3 className="text-lg font-semibold mb-3">PQC Self-Test</h3>
      <p className="text-sm text-gray-400 mb-4">
        Verify your Kyber768 protection by running a full keygen, encapsulate, and decapsulate cycle.
      </p>

      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {loading ? 'Testing...' : 'Verify My Protection'}
      </button>

      {error && (
        <div className="mt-3 p-3 rounded bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.passed ? '\u2713' : '\u2717'}
            </span>
            <span className="font-medium">
              {result.passed ? 'All checks passed' : 'Self-test FAILED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="p-3 rounded bg-gray-800 text-center">
              <div className="text-xs text-gray-400">Keygen</div>
              <div className="text-lg font-mono">{result.keygen_ms.toFixed(2)}ms</div>
            </div>
            <div className="p-3 rounded bg-gray-800 text-center">
              <div className="text-xs text-gray-400">Encapsulate</div>
              <div className="text-lg font-mono">{result.encapsulate_ms.toFixed(2)}ms</div>
            </div>
            <div className="p-3 rounded bg-gray-800 text-center">
              <div className="text-xs text-gray-400">Decapsulate</div>
              <div className="text-lg font-mono">{result.decapsulate_ms.toFixed(2)}ms</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            PK: {result.pk_size}B | SK: {result.sk_size}B | CT: {result.ct_size}B |
            Secret match: {result.shared_secret_match ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </div>
  )
}
