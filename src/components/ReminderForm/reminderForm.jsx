import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { today, parseMinor, uid } from '../../myex/model';
import Button from '../Button/button';
import Field from '../Field/field';
import { bindStyles } from '../../styles/bindStyles';
import styles from './reminderForm.module.css';

function ReminderForm() {
	const { data, setData, setModal, t, name, notify } = useApp()
	const [f, setF] = useState({
			title: '',
			amount: '',
			categoryId: 'other',
			currency: data.currency,
			date: today(),
			freq: 'monthly',
			channels: ['app', 'telegram'],
		}),
		[error, setError] = useState('')
	const u = (k, v) =>
		setF((s) => ({
			...s,
			[k]: v,
		}))
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				const amount = parseMinor(f.amount)
				if (!amount) {
					setError(t('badAmount'))
					return
				}
				if (!f.title.trim() || !f.date || !f.channels.length) return
				setData((d) => ({
					...d,
					reminders: [
						...d.reminders,
						{
							...f,
							amount,
							id: uid(),
						},
					],
				}))
				setModal(null)
				notify(t('saved'))
			}}
		>
			<h2 id="dialog-title">{t('newReminder')}</h2>
			<Field label={t('reminderTitle')}>
				<input
					required
					maxLength={100}
					value={f.title}
					onChange={(e) => u('title', e.target.value)}
				/>
			</Field>
			<div className={bindStyles(styles, "form-grid")}>
				<Field label={t('amount')} error={error}>
					<input
						required
						inputMode="decimal"
						value={f.amount}
						onChange={(e) => u('amount', e.target.value)}
					/>
				</Field>
				<Field label={t('currency')}>
					<select
						value={f.currency}
						onChange={(e) => u('currency', e.target.value)}
					>
						<option>UAH</option>
						<option>USD</option>
					</select>
				</Field>
				<Field label={t('category')}>
					<select
						value={f.categoryId}
						onChange={(e) => u('categoryId', e.target.value)}
					>
						{data.categories
							.filter((c) => !c.archived)
							.map((c) => (
								<option value={c.id} key={c.id}>
									{name(c)}
								</option>
							))}
					</select>
				</Field>
				<Field label={t('date')}>
					<input
						type="date"
						required
						value={f.date}
						onChange={(e) => u('date', e.target.value)}
					/>
				</Field>
			</div>
			<Field label={t('frequency')}>
				<select value={f.freq} onChange={(e) => u('freq', e.target.value)}>
					{['monthly', 'weekly', 'once'].map((x) => (
						<option key={x} value={x}>
							{t(x)}
						</option>
					))}
				</select>
			</Field>
			<fieldset className={bindStyles(styles, "picker-fieldset")}>
				<legend>{t('channels')}</legend>
				<div className={bindStyles(styles, "channel-options")}>
					{['app', 'telegram'].map((c) => (
						<label key={c}>
							<input
								type="checkbox"
								checked={f.channels.includes(c)}
								onChange={(e) =>
									u(
										'channels',
										e.target.checked
											? [...f.channels, c]
											: f.channels.filter((x) => x !== c),
									)
								}
							/>
							{c === 'app' ? t('inApp') : 'Telegram'}
						</label>
					))}
				</div>
			</fieldset>
			<Button type="submit" className={bindStyles(styles, "wide")} disabled={!f.channels.length}>
				{t('save')}
			</Button>
		</form>
	)
}

export default ReminderForm;
