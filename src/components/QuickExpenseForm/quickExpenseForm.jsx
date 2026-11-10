import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { categorySeed, minorText, parseMinor, uid } from '../../mivo/model'
import Icon from '../Icon/icon'
import Button from '../Button/button'
import Field from '../Field/field'
import styles from './quickExpenseForm.module.css'

function QuickExpenseForm() {
	const { data, setData, modal, setModal, t, name, notify } = useApp()
	const existing = modal.template
	const categories = data.categories.filter((category) => !category.archived)
	const currency = existing?.currency ?? data.currency
	const [title, setTitle] = useState(existing?.title ?? '')
	const [price, setPrice] = useState(existing?.amount ? minorText(existing.amount) : '')
	const [icon, setIcon] = useState(existing?.icon ?? 'coffee')
	const [categoryId, setCategoryId] = useState(
		categories.some((category) => category.id === existing?.categoryId) ? existing.categoryId : '',
	)
	const [errors, setErrors] = useState({})

	function submit(event) {
		event.preventDefault()
		const cleanTitle = title.trim()
		const amount = price.trim() ? parseMinor(price) : null
		const nextErrors = {
			title: cleanTitle ? '' : t('quickNameRequired'),
			price: price.trim() && !amount ? t('badAmount') : '',
		}
		setErrors(nextErrors)
		if (nextErrors.title || nextErrors.price) return

		const template = { id: existing?.id ?? uid(), title: cleanTitle, amount, icon, categoryId, currency }
		setData((current) => {
			const templates = current.quickExpenses ?? []
			return {
				...current,
				quickExpenses: existing
					? templates.map((item) => (item.id === existing.id ? template : item))
					: [...templates, template],
			}
		})
		setModal(null)
		notify(t('quickSaved'))
	}

	function remove() {
		setData((current) => ({
			...current,
			quickExpenses: current.quickExpenses.filter((item) => item.id !== existing.id),
		}))
		setModal(null)
		notify(t('quickDeleted'), () =>
			setData((current) => ({
				...current,
				quickExpenses: [...current.quickExpenses, existing],
			})),
		)
	}

	return (
		<form onSubmit={submit} noValidate>
			<h2 id="dialog-title">{t(existing ? 'quickEdit' : 'quickNew')}</h2>
			<Field label={t('quickName')} error={errors.title}>
				<input autoFocus maxLength={60} required value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={!!errors.title} />
			</Field>
			<Field label={`${t('amount')} · ${currency} (${t('optional')})`} error={errors.price}>
				<input inputMode="decimal" placeholder="0.00" value={price} onChange={(event) => setPrice(event.target.value)} aria-invalid={!!errors.price} aria-describedby="quick-price-help" />
			</Field>
			<p className={styles.help} id="quick-price-help">{t('quickPriceHelp')}</p>
			<Field label={t('category')}>
				<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
					<option value="">{t('quickAutoCategory')}</option>
					{categories.map((category) => <option key={category.id} value={category.id}>{name(category)}</option>)}
				</select>
			</Field>
			<fieldset className={styles.picker}>
				<legend>{t('icon')}</legend>
				<div className={styles.icons}>
					{categorySeed.map((category) => (
						<button key={category.icon} type="button" aria-label={name(category)} title={name(category)} aria-pressed={icon === category.icon} onClick={() => setIcon(category.icon)}>
							<Icon name={category.icon} />
						</button>
					))}
				</div>
			</fieldset>
			<Button className="wide" type="submit" icon="check">{t('save')}</Button>
			{existing && (
				<button className={styles.delete} type="button" onClick={remove}>
					<Icon name="trash" size={17} />
					{t('quickRemove')}
				</button>
			)}
		</form>
	)
}

export default QuickExpenseForm
