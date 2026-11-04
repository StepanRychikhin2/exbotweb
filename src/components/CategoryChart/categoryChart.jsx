import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { grouped, sum } from '../../mivo/model';
import Icon from '../Icon/icon';
import Empty from '../Empty/empty';
import { bindStyles } from '../../styles/bindStyles';
import styles from './categoryChart.module.css';

function CategoryChart({ rows, initial = 'bars' }) {
	const { data, t, name, fmt, go } = useApp()
	const [mode, setMode] = useState(initial),
		[selected, setSelected] = useState(null)
	const groups = grouped(rows, data.categories),
		total = sum(rows)
	let pos = 0
	const stops = groups
		.map((g) => {
			const from = pos
			pos += (g.amount / total) * 100
			return `${g.category?.color || '#ADB5BD'} ${from}% ${pos}%`
		})
		.join(',')
	return (
		<section className={bindStyles(styles, "panel category-chart")}>
			<div className={bindStyles(styles, "section-head")}>
				<h2>{t('whereMoney')}</h2>
				<div className={bindStyles(styles, "segmented chart-switch")}>
					{['bars', 'donut'].map((m) => (
						<button
							key={m}
							aria-pressed={mode === m}
							onClick={() => setMode(m)}
						>
							{t(m)}
						</button>
					))}
				</div>
			</div>
			{!total ? (
				<Empty action={false} />
			) : (
				<>
					<div className={bindStyles(styles, mode === 'donut' ? 'donut-layout' : 'bars-layout')}>
						{mode === 'donut' && (
							<div
								className={bindStyles(styles, "donut")}
								role="img"
								aria-label={groups
									.map((g) => `${name(g.category)} ${fmt(g.amount)}`)
									.join(', ')}
								style={{
									background: `conic-gradient(${stops})`,
								}}
							>
								<div>
									<small>
										{selected
											? name(data.categories.find((c) => c.id === selected))
											: t('total')}
									</small>
									<strong>
										{fmt(
											selected
												? groups.find((g) => g.category?.id === selected)
														?.amount || 0
												: total,
										)}
									</strong>
								</div>
							</div>
						)}
						<div className={bindStyles(styles, "category-bars")}>
							{groups.map((g) => (
								<div className={bindStyles(styles, "category-bar")} key={g.category?.id}>
									<button
										className={bindStyles(styles, "bar-main")}
										onClick={() =>
											mode === 'donut'
												? setSelected(
														selected === g.category?.id ? null : g.category?.id,
													)
												: go('category/' + g.category?.id)
										}
									>
										<span className={bindStyles(styles, "bar-label")}>
											<i
												style={{
													background: g.category?.color,
												}}
											/>
											{name(g.category)}
										</span>
										<span>
											<strong>{fmt(g.amount)}</strong>
											<small>{Math.round((g.amount / total) * 100)}%</small>
										</span>
									</button>
									{mode === 'bars' && (
										<div className={bindStyles(styles, "progress")}>
											<i
												style={{
													width: `${(g.amount / groups[0].amount) * 100}%`,
													background: g.category?.color,
												}}
											/>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
					{mode === 'donut' && selected && (
						<button
							className={bindStyles(styles, "text-button")}
							onClick={() => go('category/' + selected)}
						>
							{name(data.categories.find((c) => c.id === selected))}
							<Icon name="arrow" size={17} />
						</button>
					)}
				</>
			)}
		</section>
	)
}

export default CategoryChart;
