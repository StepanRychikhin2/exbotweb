import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { parseMinor } from '../../mivo/model'
import Button from '../Button/button'
import Field from '../Field/field'
import styles from './quickExpenseAmount.module.css'

function QuickExpenseAmount() {
	const { modal, setModal, t } = useApp()
	const { template, onSave } = modal
	const [price, setPrice] = useState('')
	const [error, setError] = useState('')
	const saving = useRef(false)

	function submit(event) {
		event.preventDefault()
		if (saving.current) return
		const amount = parseMinor(price)
		if (!amount) {
			setError(t('badAmount'))
			return
		}
		saving.current = true
		onSave(amount)
		setModal(null)
	}

	return (
		<form onSubmit={submit} noValidate>
			<h2 id="dialog-title">{t('quickEnterAmount')}</h2>
			<p className={styles.title}>{template.title}</p>
			<Field label={`${t('amount')} · ${template.currency}`} error={error}>
				<input autoFocus required inputMode="decimal" placeholder="0.00" value={price} onChange={(event) => setPrice(event.target.value)} aria-invalid={!!error} />
			</Field>
			<Button className="wide" type="submit" icon="check">{t('add')}</Button>
		</form>
	)
}

export default QuickExpenseAmount
