import { useEffect, useRef, useState } from 'react'
import { EDGE_FIRST_SHIFT_DELAY_MS, EDGE_REPEAT_DELAY_MS, EDGE_TICK_MS, EDGE_ZONE_PX } from './gridConstants'

export type DragEdge = -1 | 0 | 1

function edgeAt(clientX: number): DragEdge {
  if (clientX <= EDGE_ZONE_PX) {
    return -1
  }
  if (clientX >= window.innerWidth - EDGE_ZONE_PX) {
    return 1
  }
  return 0
}

/**
 * While `enabled`, tracks the pointer and calls `onShift(-1 | 1)` when it rests at the left / right edge of the
 * screen (once after a short dwell, then repeatedly while it stays there). Returns the current pointer X and the
 * edge the pointer is in, so the drop handler and an edge indicator can use them.
 */
export function useDragEdgeNavigation(
  enabled: boolean,
  onShift: (direction: -1 | 1) => void,
  onPointerMove?: (clientX: number) => void,
) {
  const pointerXRef = useRef(0)
  const [edge, setEdge] = useState<DragEdge>(0)
  const onShiftRef = useRef(onShift)
  const onPointerMoveRef = useRef(onPointerMove)

  useEffect(() => {
    onShiftRef.current = onShift
    onPointerMoveRef.current = onPointerMove
  }, [onShift, onPointerMove])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let currentEdge: DragEdge = edgeAt(pointerXRef.current)
    let edgeEnteredAt = performance.now()
    let lastShiftAt: number | null = null
    setEdge(currentEdge)

    function handlePointerMove(event: PointerEvent) {
      pointerXRef.current = event.clientX
      onPointerMoveRef.current?.(event.clientX)
      const nextEdge = edgeAt(event.clientX)
      if (nextEdge !== currentEdge) {
        currentEdge = nextEdge
        edgeEnteredAt = performance.now()
        lastShiftAt = null
        setEdge(nextEdge)
      }
    }

    const interval = window.setInterval(() => {
      if (currentEdge === 0) {
        return
      }
      const now = performance.now()
      const waitedSince = lastShiftAt ?? edgeEnteredAt
      const requiredDelay = lastShiftAt === null ? EDGE_FIRST_SHIFT_DELAY_MS : EDGE_REPEAT_DELAY_MS
      if (now - waitedSince >= requiredDelay) {
        lastShiftAt = now
        onShiftRef.current(currentEdge)
      }
    }, EDGE_TICK_MS)

    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.clearInterval(interval)
      setEdge(0)
    }
  }, [enabled])

  return { pointerXRef, edge }
}
