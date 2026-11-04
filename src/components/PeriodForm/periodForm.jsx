import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { monthOf, today } from '../../mivo/model';
import Button from '../Button/button';
import Field from '../Field/field';
import { bindStyles } from '../../styles/bindStyles';
import styles from './periodForm.module.css';

function PeriodForm() {
	const { modal, setModal, t } = useApp()
	const [from, setFrom] = useState(
			modal.custom?.from || monthOf(today()) + '-01',
		),
		[to, setTo] = useState(modal.custom?.to || today()),
		[error, setError] = useState('')
	return (
		<form className={styles.root}
			onSubmit={(e) => {
				e.preventDefault()
				if (!from || !to || from > to) {
					setError(t('badDates'))
					return
				}
				modal.onApply({
					from,
					to,
				})
				setModal(null)
			}}
		>
			<h2 id="dialog-title">{t('period')}</h2>
			<div className={bindStyles(styles, "form-grid")}>
				<Field label={t('from')}>
					<input
						type="date"
						required
						value={from}
						onChange={(e) => setFrom(e.target.value)}
					/>
				</Field>
				<Field label={t('to')}>
					<input
						type="date"
						required
						value={to}
						onChange={(e) => setTo(e.target.value)}
					/>
				</Field>
			</div>
			{error && (
				<p role="alert" className={bindStyles(styles, "error")}>
					{error}
				</p>
			)}
			<Button type="submit" className={bindStyles(styles, "wide")}>
				{t('apply')}
			</Button>
		</form>
	)
}

export default PeriodForm;
