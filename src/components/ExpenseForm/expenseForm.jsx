import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { minorText, today, parseMinor, uid } from '../../myex/model';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import Field from '../Field/field';
import { bindStyles } from '../../styles/bindStyles';
import styles from './expenseForm.module.css';

function ExpenseForm() {
	const { data, setData, t, name, modal, setModal, notify } = useApp()
	const existing = modal.expense
	const draft = existing || modal.draft || {}
	const [form, setForm] = useState({
		description: draft.description || '',
		amount: draft.amount ? minorText(draft.amount) : '',
		categoryId: draft.categoryId || '',
		date: draft.date || today(),
		currency: draft.currency || data.currency,
		payment: draft.payment || '',
		receipt: draft.receipt || null,
	})
	const [details, setDetails] = useState(!!(draft.payment || draft.receipt))
	const [errors, setErrors] = useState({})
	const saving = useRef(false)
	const update = (key, value) => {
		setForm((v) => ({
			...v,
			[key]: value,
		}))
		setErrors((v) => ({
			...v,
			[key]: null,
		}))
	}
	async function photo(e) {
		const file = e.target.files?.[0]
		if (!file) return
		if (
			!/^image\/(png|jpeg|webp|gif)$/.test(file.type) ||
			file.size > 2 * 1024 * 1024
		) {
			setErrors((v) => ({
				...v,
				receipt: t('photoError'),
			}))
			return
		}
		const reader = new FileReader()
		reader.onload = () => update('receipt', reader.result)
		reader.onerror = () =>
			setErrors((v) => ({
				...v,
				receipt: t('photoError'),
			}))
		reader.readAsDataURL(file)
	}
	function submit(e) {
		e.preventDefault()
		if (saving.current) return
		const amount = parseMinor(form.amount),
			errors = {}
		if (!amount) errors.amount = t('badAmount')
		if (!form.categoryId) errors.categoryId = t('requiredCategory')
		if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.date = t('dateError')
		if (Object.keys(errors).length) {
			setErrors(errors)
			return
		}
		saving.current = true
		const cat = data.categories.find((c) => c.id === form.categoryId)
		const row = {
			...form,
			description: form.description.trim() || name(cat),
			amount,
			id: existing?.id || uid(),
			createdAt: existing?.createdAt || Date.now(),
			source: 'web',
		}
		setData((d) => ({
			...d,
			expenses: existing
				? d.expenses.map((r) => (r.id === existing.id ? row : r))
				: [...d.expenses, row],
		}))
		modal.afterSave?.()
		setModal(null)
		notify(t(existing ? 'updated' : 'added'))
	}
	return (
		<form onSubmit={submit} noValidate>
			<h2 id="dialog-title">{t(existing ? 'edit' : 'confirmTitle')}</h2>
			<p className={bindStyles(styles, "modal-sub")}>{t('confirmSub')}</p>
			<div className={bindStyles(styles, "amount-field")}>
				<Field label={t('amount')} error={errors.amount}>
					<input
						autoFocus
						inputMode="decimal"
						value={form.amount}
						onChange={(e) => update('amount', e.target.value)}
						placeholder="0.00"
						aria-invalid={!!errors.amount}
					/>
				</Field>
				<label className={bindStyles(styles, "currency-select")}>
					<span className={bindStyles(styles, "sr-only")}>{t('currency')}</span>
					<select
						value={form.currency}
						onChange={(e) => update('currency', e.target.value)}
					>
						<option>UAH</option>
						<option>USD</option>
					</select>
				</label>
			</div>
			<Field label={t('description')}>
				<input
					value={form.description}
					maxLength={300}
					placeholder={t('optional')}
					onChange={(e) => update('description', e.target.value)}
				/>
			</Field>
			<div className={bindStyles(styles, "form-grid")}>
				<Field label={t('category')} error={errors.categoryId}>
					<select
						value={form.categoryId}
						onChange={(e) => update('categoryId', e.target.value)}
						aria-invalid={!!errors.categoryId}
					>
						<option value="">{t('selectCategory')}</option>
						{data.categories
							.filter((c) => !c.archived || c.id === form.categoryId)
							.map((c) => (
								<option key={c.id} value={c.id}>
									{name(c)}
								</option>
							))}
					</select>
				</Field>
				<Field label={t('date')} error={errors.date}>
					<input
						type="date"
						value={form.date}
						onChange={(e) => update('date', e.target.value)}
					/>
				</Field>
			</div>
			<button
				type="button"
				className={bindStyles(styles, "details-toggle")}
				aria-expanded={details}
				onClick={() => setDetails(!details)}
			>
				<Icon name={details ? 'close' : 'plus'} size={17} />
				{t('details')}
				<span>{t('optional')}</span>
			</button>
			{details && (
				<div className={bindStyles(styles, "optional-fields")}>
					<Field label={t('payment')}>
						<select
							value={form.payment}
							onChange={(e) => update('payment', e.target.value)}
						>
							<option value="">{t('notSelected')}</option>
							{['cash', 'card', 'online'].map((m) => (
								<option key={m} value={m}>
									{t(m)}
								</option>
							))}
						</select>
					</Field>
					<div className={bindStyles(styles, "field")}>
						<span>{t('receipt')}</span>
						{form.receipt ? (
							<div className={bindStyles(styles, "receipt-preview")}>
								<img src={form.receipt} alt={t('receipt')} />
								<button
									type="button"
									className={bindStyles(styles, "text-button danger-text")}
									onClick={() => update('receipt', null)}
								>
									{t('removePhoto')}
								</button>
							</div>
						) : (
							<label className={bindStyles(styles, "photo-upload")}>
								<Icon name="photo" />
								{t('attach')}
								<input
									type="file"
									accept="image/png,image/jpeg,image/webp,image/gif"
									onChange={photo}
								/>
							</label>
						)}
						<small>{t('receiptHelp')}</small>
						{errors.receipt && (
							<p className={bindStyles(styles, "error")} role="alert">
								{errors.receipt}
							</p>
						)}
					</div>
					<div className={bindStyles(styles, "quiet-note")}>
						<Icon name="spark" size={18} />
						{t('scan')}
						<span className={bindStyles(styles, "tag")}>{t('soon')}</span>
					</div>
				</div>
			)}
			<Button type="submit" className={bindStyles(styles, "wide")} icon="check">
				{t(existing ? 'save' : 'confirm')}
			</Button>
			{existing && (
				<button
					type="button"
					className={bindStyles(styles, "delete-button")}
					onClick={() =>
						setModal({
							type: 'delete',
							expense: existing,
						})
					}
				>
					<Icon name="trash" size={18} />
					{t('delete')}
				</button>
			)}
		</form>
	)
}

export default ExpenseForm;
