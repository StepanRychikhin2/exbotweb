import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rangeFor, filtered, sum, today } from '../../myex/model';
import Icon from '../Icon/icon';
import IconButton from '../IconButton/iconButton';
import Empty from '../Empty/empty';
import PageTitle from '../PageTitle/pageTitle';
import ExpenseRows from '../ExpenseRows/expenseRows';
import PeriodControl from '../PeriodControl/periodControl';
import LineChart from '../LineChart/lineChart';
import Comparison from '../Comparison/comparison';
import { bindStyles } from '../../styles/bindStyles';
import styles from './categoryDetail.module.css';

function CategoryDetail({ id }) {
	const { data, t, name, fmt, setModal } = useApp()
	const [period, setPeriod] = useState('month'),
		[custom, setCustom] = useState({})
	const category = data.categories.find((c) => c.id === id)
	if (!category) return <Empty />
	const range = rangeFor(period, custom)
	const rows = filtered(data.expenses, {
		currency: data.currency,
		categoryId: id,
		...range,
	})
	return (
		<>
			<PageTitle
				back="categories"
				title={name(category)}
				sub={category.archived ? t('archived') : t('categorySub')}
				action={
					<IconButton
						icon="edit"
						label={t('edit')}
						onClick={() =>
							setModal({
								type: 'category',
								category,
							})
						}
					/>
				}
			/>
			<div className={bindStyles(styles, "category-total")}>
				<span
					className={bindStyles(styles, "category-icon")}
					style={{
						'--category': category.color,
					}}
				>
					<Icon name={category.icon} size={30} />
				</span>
				<div>
					<small>{t('total')}</small>
					<strong>{fmt(sum(rows))}</strong>
				</div>
				{!category.archived && (
					<IconButton
						icon="plus"
						label={t('addTitle')}
						onClick={() =>
							setModal({
								type: 'expense',
								draft: {
									categoryId: id,
									currency: data.currency,
									date: today(),
								},
							})
						}
					/>
				)}
			</div>
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<LineChart rows={rows} {...range} />
			<Comparison categoryId={id} />
			<div className={bindStyles(styles, "section-head")}>
				<h2>{t('expenses')}</h2>
				<span className={bindStyles(styles, "muted")}>
					{rows.length} {t('records')}
				</span>
			</div>
			{rows.length ? (
				<ExpenseRows rows={rows} groupDays />
			) : (
				<Empty action={!category.archived} />
			)}
		</>
	)
}

export default CategoryDetail;
