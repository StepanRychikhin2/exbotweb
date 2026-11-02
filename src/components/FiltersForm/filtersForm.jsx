import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../Button/button';
import Field from '../Field/field';
import { bindStyles } from '../../styles/bindStyles';
import styles from './filtersForm.module.css';

function FiltersForm() {
	const { modal, setModal, data, t, name } = useApp()
	const [f, setF] = useState(modal.filters || {}),
		[error, setError] = useState('')
	const update = (k, v) =>
		setF((s) => ({
			...s,
			[k]: v,
		}))
	return (
		<form className={styles.root}
			onSubmit={(e) => {
				e.preventDefault()
				if (f.from && f.to && f.from > f.to) {
					setError(t('badDates'))
					return
				}
				if (f.min && f.max && Number(f.min) > Number(f.max)) {
					setError(t('badAmount'))
					return
				}
				modal.onApply(f)
				setModal(null)
			}}
		>
			<h2 id="dialog-title">{t('filters')}</h2>
			<Field label={t('category')}>
				<select
					value={f.categoryId || ''}
					onChange={(e) => update('categoryId', e.target.value)}
				>
					<option value="">{t('allCategories')}</option>
					{data.categories.map((c) => (
						<option key={c.id} value={c.id}>
							{name(c)}
						</option>
					))}
				</select>
			</Field>
			<div className={bindStyles(styles, "form-grid")}>
				<Field label={t('from')}>
					<input
						type="date"
						value={f.from || ''}
						onChange={(e) => update('from', e.target.value)}
					/>
				</Field>
				<Field label={t('to')}>
					<input
						type="date"
						value={f.to || ''}
						onChange={(e) => update('to', e.target.value)}
					/>
				</Field>
				<Field label={t('minAmount')}>
					<input
						type="number"
						min="0"
						step="0.01"
						value={f.min || ''}
						onChange={(e) => update('min', e.target.value)}
					/>
				</Field>
				<Field label={t('maxAmount')}>
					<input
						type="number"
						min="0"
						step="0.01"
						value={f.max || ''}
						onChange={(e) => update('max', e.target.value)}
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
			<Button
				secondary
				type="button"
				className={bindStyles(styles, "wide")}
				onClick={() => {
					modal.onApply({})
					setModal(null)
				}}
			>
				{t('reset')}
			</Button>
		</form>
	)
}

export default FiltersForm;
