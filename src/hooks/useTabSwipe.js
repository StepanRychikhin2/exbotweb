import { useRef } from 'react'
import { navs } from '../config/navigation'

export const mobileTabQuery = '(max-width: 900px)'

export function useTabSwipe({ activeTab, route, go, disabled }) {
	const start = useRef(null)
	const ignoreClickUntil = useRef(0)

	return {
		onPointerDown(event) {
			start.current = null
			ignoreClickUntil.current = 0
			const onBar = event.currentTarget.tagName === 'NAV'
			const canSwipe = event.pointerType === 'touch' || (onBar && event.pointerType === 'mouse')
			if (!canSwipe || !event.isPrimary || event.button !== 0 || disabled) return
			if (!window.matchMedia(mobileTabQuery).matches) return

			if (!onBar) {
				const { clientX, target } = event
				// Leave edge gestures, form controls and the interactive chart to the browser or component.
				if (clientX < 20 || clientX > window.innerWidth - 20) return
				if (target.closest('input, textarea, select, label, [contenteditable], [data-tab-swipe-ignore]')) return
			}

			start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, route }
		},
		onPointerCancel() {
			start.current = null
		},
		onPointerUp(event) {
			const gesture = start.current
			start.current = null
			if (!gesture || gesture.id !== event.pointerId || gesture.route !== route || disabled) return

			const dx = event.clientX - gesture.x
			const dy = event.clientY - gesture.y
			if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.4) return

			ignoreClickUntil.current = performance.now() + 400
			const index = navs.findIndex(([tab]) => tab === activeTab)
			const next = navs[index + (dx < 0 ? 1 : -1)]
			if (index >= 0 && next) go(next[0])
		},
		onClickCapture(event) {
			if (event.detail && performance.now() < ignoreClickUntil.current) {
				event.preventDefault()
				event.stopPropagation()
				ignoreClickUntil.current = 0
			}
		},
	}
}
