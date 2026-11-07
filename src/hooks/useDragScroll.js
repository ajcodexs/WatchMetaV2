import { useRef } from 'react'

const DRAG_THRESHOLD = 5

export default function useDragScroll() {
  const rowRef = useRef(null)
  const dragRef = useRef(null)
  const suppressClickRef = useRef(null)

  function finishDrag(event) {
    const row = rowRef.current
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return

    if (dragRef.current.moved) {
      suppressClickRef.current = {
        target: dragRef.current.target,
        expiresAt: performance.now() + 500,
      }
    }

    if (row?.hasPointerCapture(event.pointerId)) {
      row.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    row?.classList.remove('is-dragging')
  }

  return {
    ref: rowRef,
    className: 'drag-scroll-row',
    tabIndex: 0,
    onPointerDown(event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      const row = rowRef.current
      if (!row) return

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: row.scrollLeft,
        target: event.target.closest('a, button'),
        moved: false,
      }
    },
    onPointerMove(event) {
      const drag = dragRef.current
      const row = rowRef.current
      if (!drag || !row || drag.pointerId !== event.pointerId) return

      const distance = event.clientX - drag.startX
      if (Math.abs(distance) > DRAG_THRESHOLD) {
        drag.moved = true
        row.classList.add('is-dragging')
        if (!row.hasPointerCapture(event.pointerId)) {
          row.setPointerCapture(event.pointerId)
        }
      }
      if (drag.moved) {
        event.preventDefault()
        row.scrollLeft = drag.startScrollLeft - distance
      }
    },
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
    onPointerLeave(event) {
      if (dragRef.current && !rowRef.current?.hasPointerCapture(event.pointerId)) {
        finishDrag(event)
      }
    },
    onClickCapture(event) {
      const clickedTarget = event.target.closest('a, button')
      const suppressedClick = suppressClickRef.current
      if (!suppressedClick) return
      suppressClickRef.current = null
      if (performance.now() > suppressedClick.expiresAt || clickedTarget !== suppressedClick.target) return
      event.preventDefault()
      event.stopPropagation()
    },
    onKeyDown(event) {
      const row = rowRef.current
      if (!row) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        row.scrollBy({ left: 160, behavior: 'smooth' })
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        row.scrollBy({ left: -160, behavior: 'smooth' })
      }
    },
  }
}
