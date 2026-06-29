import { useState, useRef, useCallback, useEffect } from 'react'
import { tokenStore } from '../lib/tokenStore'

interface StreamState {
  text: string
  isStreaming: boolean
  isConnecting: boolean
  error: string | null
}

export function useInsightStream(url: string | null) {
  const [state, setState] = useState<StreamState>({
    text: '',
    isStreaming: false,
    isConnecting: false,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const start = useCallback(async () => {
    if (!url) return

    // Cancel any existing stream
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setState({ text: '', isStreaming: false, isConnecting: true, error: null })

    const tokens = tokenStore.get()
    if (!tokens) {
      setState(s => ({ ...s, isConnecting: false, error: 'Not authenticated' }))
      return
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: 'text/event-stream',
        },
      })

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.status}`)
      }

      setState(s => ({ ...s, isConnecting: false, isStreaming: true }))

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const event of events) {
          if (!event.trim()) continue
          const lines = event.split('\n')
          let dataBuffer = ''
          for (const line of lines) {
            if (line.startsWith('data:')) {
              let val = line.slice(5).trim()
              try {
                const parsed = JSON.parse(val)
                dataBuffer += parsed.text
              } catch (e) {
                // If it's not JSON, fallback to raw text (for backwards compatibility)
                dataBuffer += val
              }
            }
          }
          if (dataBuffer) {
            setState(s => ({ ...s, text: s.text + dataBuffer }))
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split('\n')
        let dataBuffer = ''
        for (const line of lines) {
          if (line.startsWith('data:')) {
            let val = line.slice(5).trim()
            try {
              const parsed = JSON.parse(val)
              dataBuffer += parsed.text
            } catch (e) {
              dataBuffer += val
            }
          }
        }
        if (dataBuffer) {
          setState(s => ({ ...s, text: s.text + dataBuffer }))
        }
      }

      setState(s => ({ ...s, isStreaming: false }))
    } catch (err) {
      if (controller.signal.aborted) return
      const message = err instanceof Error ? err.message : 'Unable to connect to your energy advisor. Please try again.'
      setState(s => ({
        ...s,
        isConnecting: false,
        isStreaming: false,
        error: s.text ? 'Connection interrupted — Regenerate for the full analysis.' : message,
      }))
    }
  }, [url])

  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
    setState(s => ({ ...s, isStreaming: false, isConnecting: false }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return { ...state, start, stop }
}
