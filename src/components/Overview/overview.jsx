import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rangeFor, filtered, monthOf, today, sum } from '../../myex/model';
import Icon from '../Icon/icon';
import PageTitle from '../PageTitle/pageTitle';
import ExpenseRows from '../ExpenseRows/expenseRows';
import PeriodControl from '../PeriodControl/periodControl';
import CategoryChart from '../CategoryChart/categoryChart';
import LineChart from '../LineChart/lineChart';
import Comparison from '../Comparison/comparison';
import { bindStyles } from '../../styles/bindStyles';
import styles from './overview.module.css';

function Overview() {
	const { data, t, fmt, go } = useApp()
	const [period, setPeriod] = useState('today'),
		[custom, setCustom] = useState({})
	const range = rangeFor(period, custom)
	const rows = filtered(data.expenses, {
		currency: data.currency,
		...range,
	})
	const monthRows = filtered(data.expenses, {
		currency: data.currency,
		from: monthOf(today()) + '-01',
		to: today(),
	})
	return (
		<>
			<PageTitle title={t('overview')} sub={t('overviewSub')} />
			<section className={bindStyles(styles, "summary-card glass")}>
				<div className={bindStyles(styles, "main-stat")}>
					<span>{t('todaySpent')}</span>
					<strong>
						{fmt(
							sum(
								filtered(data.expenses, {
									currency: data.currency,
									from: today(),
									to: today(),
								}),
							),
						)}
					</strong>
					<span className={bindStyles(styles, "stat-note")}>
						<i className={bindStyles(styles, "blue-dot")} />
						{t('heroFine')}
					</span>
				</div>
				<div className={bindStyles(styles, "secondary-stats")}>
					<div>
						<span>{t('monthSpent')}</span>
						<strong>{fmt(sum(monthRows))}</strong>
					</div>
					<div>
						<span title={t('dailyAverageHelp')}>{t('dailyAverage')}</span>
						<strong>
							{fmt(Math.round(sum(monthRows) / Number(today().slice(8))))}
						</strong>
					</div>
				</div>
			</section>
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<div className={bindStyles(styles, "analytics-grid")}>
				<CategoryChart rows={rows} />
				<LineChart rows={rows} {...range} />
			</div>
			<Comparison />
			<div className={bindStyles(styles, "section-head recent-head")}>
				<h2>{t('recent')}</h2>
				<button className={bindStyles(styles, "text-button")} onClick={() => go('expenses')}>
					{t('seeAll')}
					<Icon name="arrow" size={17} />
				</button>
			</div>
			<ExpenseRows
				rows={filtered(data.expenses, {
					currency: data.currency,
				}).slice(-4)}
			/>
		</>
	)
}

export default Overview;
