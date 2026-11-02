import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { filtered, dateText, catName, sum } from '../../myex/model';
import Icon from '../Icon/icon';
import Empty from '../Empty/empty';
import PageTitle from '../PageTitle/pageTitle';
import ExpenseRows from '../ExpenseRows/expenseRows';
import { bindStyles } from '../../styles/bindStyles';
import styles from './history.module.css';

function History() {
	const { data, t, fmt, setModal } = useApp()
	const [query, setQuery] = useState(''),
		[filters, setFilters] = useState({})
	const rows = filtered(data.expenses, {
		currency: data.currency,
		query,
		...filters,
	})
	const active = Object.values(filters).filter(Boolean).length
	return (
		<>
			<PageTitle title={t('expenses')} sub={t('historySub')} />
			<div className={bindStyles(styles, "history-tools")}>
				<label className={bindStyles(styles, "search-box")}>
					<Icon name="search" size={20} />
					<input
						value={query}
						placeholder={t('search')}
						aria-label={t('search')}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</label>
				<button
					className={bindStyles(styles, `filter-button ${active ? 'selected' : ''}`)}
					onClick={() =>
						setModal({
							type: 'filters',
							filters,
							onApply: setFilters,
						})
					}
				>
					<Icon name="filter" />
					<span>{t('filters')}</span>
					{active > 0 && <b>{active}</b>}
				</button>
			</div>
			{active > 0 && (
				<div className={bindStyles(styles, "active-filters")}>
					<span>
						{filters.from && dateText(filters.from, data.lang)}
						{filters.to && ' — ' + dateText(filters.to, data.lang)}
						{filters.categoryId &&
							' · ' +
								catName(
									data.categories.find((c) => c.id === filters.categoryId),
									data.lang,
								)}
					</span>
					<button className={bindStyles(styles, "text-button")} onClick={() => setFilters({})}>
						{t('reset')}
						<Icon name="close" size={14} />
					</button>
				</div>
			)}
			<div className={bindStyles(styles, "history-total")}>
				<span>
					{rows.length} {t('records')}
				</span>
				<strong>{fmt(sum(rows))}</strong>
			</div>
			{rows.length ? (
				<ExpenseRows rows={rows} groupDays />
			) : (
				<Empty search={!!query || !!active} />
			)}
		</>
	)
}

export default History;
