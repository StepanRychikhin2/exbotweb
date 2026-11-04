import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { filtered, rangeFor, sum } from '../../mivo/model';
import Icon from '../Icon/icon';
import IconButton from '../IconButton/iconButton';
import PageTitle from '../PageTitle/pageTitle';
import PeriodControl from '../PeriodControl/periodControl';
import { bindStyles } from '../../styles/bindStyles';
import styles from './categories.module.css';

function Categories() {
	const { data, t, fmt, name, go, setModal } = useApp()
	const [archived, setArchived] = useState(false)
	const [period, setPeriod] = useState('month'),
		[custom, setCustom] = useState({})
	const rows = filtered(data.expenses, {
		currency: data.currency,
		...rangeFor(period, custom),
	})
	const cats = data.categories.filter((c) => Boolean(c.archived) === archived)
	return (
		<>
			<PageTitle
				title={t('categories')}
				sub={t('categorySub')}
				action={
					<IconButton
						icon="plus"
						label={t('newCategory')}
						onClick={() =>
							setModal({
								type: 'category',
							})
						}
					/>
				}
			/>
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<div className={bindStyles(styles, "section-head")}>
				<div className={bindStyles(styles, "segmented")}>
					<button aria-pressed={!archived} onClick={() => setArchived(false)}>
						{t('active')}
					</button>
					<button aria-pressed={archived} onClick={() => setArchived(true)}>
						{t('archived')}
					</button>
				</div>
			</div>
			<div className={bindStyles(styles, "category-grid")}>
				{cats.map((c) => {
					const total = sum(rows.filter((r) => r.categoryId === c.id))
					return (
						<button
							className={bindStyles(styles, "category-tile")}
							key={c.id}
							onClick={() => go('category/' + c.id)}
						>
							<span
								className={bindStyles(styles, "category-icon")}
								style={{
									'--category': c.color,
								}}
							>
								<Icon name={c.icon} size={26} />
							</span>
							<Icon name="chevron" size={16} />
							<h3>{name(c)}</h3>
							<strong>{fmt(total)}</strong>
							<span className={bindStyles(styles, "muted")}>
								{rows.filter((r) => r.categoryId === c.id).length}{' '}
								{t('records')}
							</span>
						</button>
					)
				})}
				<button
					className={bindStyles(styles, "category-tile new-category")}
					onClick={() =>
						setModal({
							type: 'category',
						})
					}
				>
					<span className={bindStyles(styles, "category-icon")}>
						<Icon name="plus" size={26} />
					</span>
					<h3>{t('newCategory')}</h3>
				</button>
			</div>
		</>
	)
}

export default Categories;
