import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { minorText, parseMinor } from '../../mivo/model';
import Button from '../Button/button';
import Field from '../Field/field';
import { bindStyles } from '../../styles/bindStyles';
import styles from './budgetForm.module.css';

function BudgetForm() {
	const { modal, setModal, data, setData, t, notify } = useApp()
	const [value, setValue] = useState(modal.limit ? minorText(modal.limit) : ''),
		[error, setError] = useState('')
	return (
		<form className={styles.root}
			onSubmit={(e) => {
				e.preventDefault()
				const n = parseMinor(value)
				if (!n) {
					setError(t('badAmount'))
					return
				}
				const key = modal.month + '|' + data.currency
				setData((d) => ({
					...d,
					budgets: {
						...d.budgets,
						[key]: n,
					},
				}))
				setModal(null)
				notify(t('saved'))
			}}
		>
			<h2 id="dialog-title">{t('limit')}</h2>
			<p className={bindStyles(styles, "modal-sub")}>
				{modal.month} · {data.currency}
			</p>
			<Field label={t('amount')} error={error}>
				<input
					autoFocus
					inputMode="decimal"
					value={value}
					placeholder="20 000"
					onChange={(e) => setValue(e.target.value)}
				/>
			</Field>
			<p className={bindStyles(styles, "form-foot")}>{t('budgetCurrencies')}</p>
			<Button className={bindStyles(styles, "wide")} type="submit">
				{t('save')}
			</Button>
		</form>
	)
}

export default BudgetForm;
