import { useApp } from '../../context/AppContext'
import { guessCategory, today, uid } from '../../mivo/model'
import Icon from '../Icon/icon'
import styles from './quickExpenses.module.css'

function QuickExpenses() {
	const { data, setData, setModal, t, fmt, notify } = useApp()
	const templates = (data.quickExpenses ?? []).filter((item) => item.currency === data.currency)
	if (!templates.length) return null

	function addFromTemplate(template) {
		const categories = data.categories.filter((category) => !category.archived)
		if (!categories.length) {
			notify(t('quickNoCategories'))
			return
		}
		const { title: description, currency, amount } = template
		const categoryId = template.categoryId
			? categories.find((category) => category.id === template.categoryId)?.id
			: guessCategory(description, categories) || categories.find((category) => category.id === 'other')?.id

		if (!categoryId) {
			setModal({ type: 'expense', draft: { description, currency, amount, date: today() } })
			return
		}

		function addExpense(price) {
			const row = {
				id: uid(),
				description,
				amount: price,
				currency,
				categoryId,
				date: today(),
				createdAt: Date.now(),
				payment: '',
				receipt: null,
				source: 'web',
			}
			setData((current) => ({ ...current, expenses: [...current.expenses, row] }))
			notify(t('added'), () =>
				setData((current) => ({
					...current,
					expenses: current.expenses.filter((expense) => expense.id !== row.id),
				})),
			)
		}

		if (amount) addExpense(amount)
		else setModal({ type: 'quickExpenseAmount', template, onSave: addExpense })
	}

	return (
		<section className={styles.section} aria-labelledby="quick-expenses-title">
			<h2 id="quick-expenses-title">{t('quickExpenses')}</h2>
			<ul className={styles.list}>
				{templates.map((item) => (
					<li className={styles.card} key={item.id}>
						<button type="button" className={styles.add} onClick={() => addFromTemplate(item)}>
							<span className={styles.icon}><Icon name={item.icon} size={17} /></span>
							<span className={styles.details}>
								<strong>{item.title}</strong>
								<small>{item.amount ? fmt(item.amount, item.currency) : t('quickEnterAmount')}</small>
							</span>
						</button>
						<button
							type="button"
							className={styles.edit}
							aria-label={`${t('edit')}: ${item.title}`}
							onClick={() => setModal({ type: 'quickExpenseTemplate', template: item })}
						>
							<Icon name="edit" size={15} />
						</button>
					</li>
				))}
			</ul>
		</section>
	)
}

export default QuickExpenses
