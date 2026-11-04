import { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { shiftDay, sum, dateText } from '../../mivo/model';
import { bindStyles } from '../../styles/bindStyles';
import styles from './lineChart.module.css';

function LineChart({ rows, from, to }) {
	const { t, fmt, data } = useApp()
	const ref = useRef(null)
	const [width, setWidth] = useState(400)
	const [chosen, setChosen] = useState(null)
	useEffect(() => {
		const o = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
		if (ref.current) o.observe(ref.current)
		return () => o.disconnect()
	}, [])
	const dayCount = Math.max(
		1,
		Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1,
	)
	const step = Math.max(1, Math.ceil(dayCount / 366))
	const dates = []
	for (let d = from; d <= to; d = shiftDay(d, step)) dates.push(d)
	const ends = dates.map((d) =>
		shiftDay(d, step - 1) > to ? to : shiftDay(d, step - 1),
	)
	const values = dates.map((d, i) =>
		sum(rows.filter((r) => r.date >= d && r.date <= ends[i])),
	)
	const high = Math.max(...values, 100)
	const h = 190,
		left = 45,
		right = 14,
		top = 16,
		bottom = 30
	const x = (i) =>
		left +
		(dates.length < 2
			? (width - left - right) / 2
			: (i / (dates.length - 1)) * (width - left - right))
	const y = (v) => h - bottom - (v / high) * (h - bottom - top)
	const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
	const chosenIndex = Math.max(
		0,
		dates.indexOf(chosen) < 0 ? dates.length - 1 : dates.indexOf(chosen),
	)
	return (
		<section className={bindStyles(styles, "panel line-panel")}>
			<div className={bindStyles(styles, "section-head")}>
				<h2>{t('yourRhythm')}</h2>
				<span className={bindStyles(styles, "muted")}>{data.currency}</span>
			</div>
			<div ref={ref} className={bindStyles(styles, "line-chart")}>
				<svg
					viewBox={`0 0 ${width} ${h}`}
					role="img"
					aria-label={t('yourRhythm')}
					onPointerDown={(e) => {
						const b = e.currentTarget.getBoundingClientRect()
						const i = Math.max(
							0,
							Math.min(
								dates.length - 1,
								Math.round(
									((((e.clientX - b.left) / b.width) * width - left) /
										(width - left - right)) *
										(dates.length - 1),
								),
							),
						)
						setChosen(dates[i])
					}}
				>
					{[0, 0.5, 1].map((k) => (
						<g key={k}>
							<line
								x1={left}
								y1={y(high * k)}
								x2={width - right}
								y2={y(high * k)}
								className={bindStyles(styles, "chart-grid")}
							/>
							<text x={left - 8} y={y(high * k) + 4} textAnchor="end">
								{Math.round((high * k) / 100)}
							</text>
						</g>
					))}
					{dates
						.filter(
							(d, i) =>
								i === 0 ||
								i === dates.length - 1 ||
								i === Math.floor(dates.length / 3) ||
								i === Math.floor((dates.length * 2) / 3),
						)
						.map((d) => (
							<text
								key={d}
								x={x(dates.indexOf(d))}
								y={h - 5}
								textAnchor="middle"
							>
								{from.slice(0, 7) === to.slice(0, 7)
									? d.slice(8)
									: d.slice(5).replace('-', '/')}
							</text>
						))}
					{values.length > 1 && (
						<path
							d={
								path +
								` L${x(values.length - 1)},${h - bottom} L${x(0)},${h - bottom} Z`
							}
							className={bindStyles(styles, "chart-area")}
						/>
					)}
					<path d={path} className={bindStyles(styles, "chart-path")} />
					{values.length > 0 && (
						<>
							<line
								x1={x(chosenIndex)}
								y1={top}
								x2={x(chosenIndex)}
								y2={h - bottom}
								className={bindStyles(styles, "chart-guide")}
							/>
							<circle
								cx={x(chosenIndex)}
								cy={y(values[chosenIndex] || 0)}
								r="5"
								className={bindStyles(styles, "chart-dot")}
							/>
						</>
					)}
				</svg>
			</div>
			<div className={bindStyles(styles, "chart-caption")}>
				<label>
					{t(step > 1 ? 'period' : 'day')}
					<select
						value={dates[chosenIndex] || ''}
						onChange={(e) => setChosen(e.target.value)}
					>
						{dates.map((d, i) => (
							<option value={d} key={d}>
								{dateText(d, data.lang)}
								{step > 1 ? ' — ' + dateText(ends[i], data.lang) : ''}
							</option>
						))}
					</select>
				</label>
				<strong>{fmt(values[chosenIndex] || 0)}</strong>
			</div>
		</section>
	)
}

export default LineChart;
