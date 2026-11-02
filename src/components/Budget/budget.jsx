import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { monthOf, today, sum, filtered } from '../../myex/model';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import IconButton from '../IconButton/iconButton';
import PageTitle from '../PageTitle/pageTitle';
import CategoryChart from '../CategoryChart/categoryChart';
import { bindStyles } from '../../styles/bindStyles';
import styles from './budget.module.css';

function Budget() {
	const { data, t, fmt, setModal } = useApp()
	const [month, setMonth] = useState(monthOf(today()))
	const key = month + '|' + data.currency,
		limit = data.budgets[key] || 0,
		used = sum(
			filtered(data.expenses, {
				currency: data.currency,
				from: month + '-01',
				to: month + '-31',
			}),
		),
		remaining = limit - used,
		percent = limit ? Math.round((used / limit) * 100) : 0
	return (
		<>
			<PageTitle title={t('budget')} sub={t('budgetSub')} />
			<label className={bindStyles(styles, "month-picker")}>
				<Icon name="calendar" />
				<span>{t('monthPick')}</span>
				<input
					type="month"
					value={month}
					onChange={(e) => e.target.value && setMonth(e.target.value)}
					aria-label={t('monthPick')}
				/>
			</label>
			{limit ? (
				<section className={bindStyles(styles, "budget-card glass")}>
					<div className={bindStyles(styles, "section-head")}>
						<span>{t('limit')}</span>
						<IconButton
							icon="edit"
							label={t('editBudget')}
							onClick={() =>
								setModal({
									type: 'budget',
									month,
									limit,
								})
							}
						/>
					</div>
					<div className={bindStyles(styles, "budget-limit")}>{fmt(limit)}</div>
					<div className={bindStyles(styles, "budget-progress-label")}>
						<span>{t('spent')}</span>
						<strong>
							{percent}% {t('used')}
						</strong>
					</div>
					<div
						className={bindStyles(styles, `progress budget-progress ${remaining < 0 ? 'danger-progress' : ''}`)}
						role="progressbar"
						aria-label={t('budget')}
						aria-valuenow={Math.min(percent, 100)}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<i
							style={{
								width: Math.min(percent, 100) + '%',
							}}
						/>
					</div>
					<div className={bindStyles(styles, "budget-numbers")}>
						<div>
							<span>{t('spent')}</span>
							<strong>{fmt(used)}</strong>
						</div>
						<div className={bindStyles(styles, remaining < 0 ? 'danger-text' : '')}>
							<span>{t(remaining < 0 ? 'overBudget' : 'remaining')}</span>
							<strong>{fmt(Math.abs(remaining))}</strong>
						</div>
					</div>
					<div
						className={bindStyles(styles, `budget-status ${remaining < 0 ? 'danger-text' : ''}`)}
					>
						<Icon name={remaining < 0 ? 'bell' : 'check'} />
						{t(remaining < 0 ? 'overBudget' : 'budgetGood')}
					</div>
				</section>
			) : (
				<div className={bindStyles(styles, "panel empty")}>
					<span className={bindStyles(styles, "empty-icon")}>
						<Icon name="wallet" size={32} />
					</span>
					<h2>{t('noBudget')}</h2>
					<p>{t('noBudgetSub')}</p>
					<Button
						onClick={() =>
							setModal({
								type: 'budget',
								month,
								limit: 0,
							})
						}
					>
						{t('setBudget')}
					</Button>
				</div>
			)}
			<p className={bindStyles(styles, "explainer")}>
				<Icon name="wallet" size={20} />
				{t('budgetCurrencies')}
			</p>
			<CategoryChart
				rows={filtered(data.expenses, {
					currency: data.currency,
					from: month + '-01',
					to: month + '-31',
				})}
			/>
		</>
	)
}

export default Budget;
