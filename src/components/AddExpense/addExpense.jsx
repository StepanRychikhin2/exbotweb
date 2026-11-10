import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { parseQuick, filtered, today, catName, sum } from '../../mivo/model';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import Empty from '../Empty/empty';
import PageTitle from '../PageTitle/pageTitle';
import ExpenseRows from '../ExpenseRows/expenseRows';
import QuickExpenses from '../QuickExpenses/quickExpenses';
import { bindStyles } from '../../styles/bindStyles';
import styles from './addExpense.module.css';

function AddExpense() {
	const { data, t, fmt, setModal } = useApp()
	const [text, setText] = useState('')
	const [error, setError] = useState('')
	const quick = parseQuick(text, data.categories)
	const rows = filtered(data.expenses, {
		currency: data.currency,
		from: today(),
		to: today(),
	})
	const cat = data.categories.find((c) => c.id === quick?.categoryId)
	function review(e) {
		e.preventDefault()
		if (!quick) {
			setError(t('badQuick'))
			return
		}
		setError('')
		setModal({
			type: 'expense',
			draft: {
				...quick,
				date: today(),
				currency: data.currency,
			},
			afterSave: () => setText(''),
		})
	}
	return (
		<>
			<PageTitle title={t('addTitle')} sub={t('addSub')} />
			<div className={bindStyles(styles, "add-layout")}>
				<div className={bindStyles(styles, "add-form-column")}>
					<form onSubmit={review}>
						<div className={bindStyles(styles, "quick-card glass")}>
							<label htmlFor="quick-expense">{t('quickLabel')}</label>
							<input
								id="quick-expense"
								className={bindStyles(styles, "quick-input")}
								value={text}
								maxLength={300}
								onChange={(e) => {
									setText(e.target.value)
									setError('')
								}}
								placeholder={t('quickPlaceholder')}
								autoComplete="off"
								aria-invalid={!!error}
								aria-describedby={error ? 'quick-error' : undefined}
							/>
							<div className={bindStyles(styles, "quick-meta")}>
								{cat ? (
									<span className={bindStyles(styles, "recognized")}>
										<Icon name={cat.icon} size={15} />
										{catName(cat, data.lang)}
									</span>
								) : (
									<span>
										<Icon name="coffee" size={15} />
										{t('category')}
									</span>
								)}
								<span>
									{t('today')} · {data.currency}
								</span>
							</div>
						</div>
						{error && (
							<p id="quick-error" className={bindStyles(styles, "error")} role="alert">
								{error}
							</p>
						)}
						<Button className={bindStyles(styles, "wide")} icon="arrow" type="submit">
							{t('review')}
						</Button>
					</form>
					<QuickExpenses />
					<button
						className={bindStyles(styles, "category-entry")}
						onClick={() =>
							setModal({
								type: 'chooseCategory',
							})
						}
					>
						<Icon name="grid" />
						<span>{t('byCategory')}</span>
						<Icon name="chevron" size={18} />
					</button>
					<button
						type="button"
						className={styles['category-entry']}
						onClick={() => setModal({ type: 'quickExpenseTemplate' })}
					>
						<Icon name="plus" />
						<span>{t('quickNewButton')}</span>
						<Icon name="chevron" size={18} />
					</button>
					<div className={bindStyles(styles, "quiet-note")}>
						<Icon name="photo" size={19} />
						<span>{t('scan')}</span>
						<span className={bindStyles(styles, "tag")}>{t('soon')}</span>
					</div>
					<p className={bindStyles(styles, "add-motto")}>{t('heroFine')}</p>
				</div>
				<section className={bindStyles(styles, "recent-panel")}>
					<div className={bindStyles(styles, "section-head")}>
						<h2>{t('today')}</h2>
						<strong className={bindStyles(styles, "section-total")}>{fmt(sum(rows))}</strong>
					</div>
					{rows.length ? (
						<ExpenseRows rows={rows.slice(-5)} />
					) : (
						<Empty action={false} />
					)}
					<div className={bindStyles(styles, "desktop-only tip-panel")}>
						<Icon name="check" />
						<p>{t('confirmSub')}</p>
					</div>
				</section>
			</div>
		</>
	)
}

export default AddExpense;
