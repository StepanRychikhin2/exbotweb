import React from 'react';
import { useApp } from '../../context/AppContext';
import { today, dateText, sum } from '../../myex/model';
import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './expenseRows.module.css';

function ExpenseRows({ rows, groupDays = false, onSelect }) {
	const { data, t, fmt, name, desc, setModal } = useApp()
	const sorted = [...rows].sort(
		(a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
	)
	let prior = ''
	return (
		<div className={bindStyles(styles, "expense-list")}>
			{sorted.map((e) => {
				const show = groupDays && prior !== e.date
				prior = e.date
				const c = data.categories.find((c) => c.id === e.categoryId)
				return (
					<React.Fragment key={e.id}>
						{show && (
							<div className={bindStyles(styles, "day-heading")}>
								<span>
									{e.date === today()
										? t('today')
										: dateText(e.date, data.lang)}
								</span>
								<strong>
									{fmt(sum(rows.filter((r) => r.date === e.date)))}
								</strong>
							</div>
						)}
						<button
							className={bindStyles(styles, "expense-row")}
							onClick={() =>
								onSelect
									? onSelect(e)
									: setModal({
											type: 'expense',
											expense: e,
										})
							}
						>
							<span
								className={bindStyles(styles, "category-icon")}
								style={{
									'--category': c?.color || '#ADB5BD',
								}}
							>
								<Icon name={c?.icon} />
							</span>
							<span className={bindStyles(styles, "expense-text")}>
								<strong>{desc(e)}</strong>
								<small>
									{name(c)}
									{e.receipt && <Icon name="photo" size={12} />}
								</small>
							</span>
							<strong className={bindStyles(styles, "expense-amount")}>
								{fmt(e.amount, e.currency)}
							</strong>
							<Icon name="chevron" size={15} />
						</button>
					</React.Fragment>
				)
			})}
		</div>
	)
}

export default ExpenseRows;
