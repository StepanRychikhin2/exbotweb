import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { shiftDay, nextDue, uid, today, dateText } from '../../myex/model';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import IconButton from '../IconButton/iconButton';
import PageTitle from '../PageTitle/pageTitle';
import { bindStyles } from '../../styles/bindStyles';
import styles from './reminders.module.css';

function Reminders() {
	const { data, setData, t, fmt, name, setModal, notify } = useApp()
	const inFlight = useRef(new Set())
	function handle(r, action) {
		const occurrence = r.id + '|' + r.date
		if (inFlight.current.has(occurrence)) return
		inFlight.current.add(occurrence)
		setData((d) => {
			if (action === 'confirm' && d.paidOccurrences.includes(occurrence))
				return d
			const next =
				action === 'postpone' ? shiftDay(r.date, 1) : nextDue(r.date, r.freq)
			return {
				...d,
				reminders: next
					? d.reminders.map((x) =>
							x.id === r.id
								? {
										...x,
										date: next,
									}
								: x,
						)
					: d.reminders.filter((x) => x.id !== r.id),
				...(action === 'confirm'
					? {
							expenses: [
								...d.expenses,
								{
									id: uid(),
									date: today(),
									amount: r.amount,
									currency: r.currency,
									categoryId: r.categoryId,
									description: r.title,
									...(r.en
										? {
												en: r.en,
											}
										: {}),
									payment: '',
									receipt: null,
									source: 'web',
									createdAt: Date.now(),
								},
							],
							paidOccurrences: [...d.paidOccurrences, occurrence],
						}
					: {}),
			}
		})
		notify(t(action === 'confirm' ? 'paymentConfirmed' : 'saved'))
	}
	return (
		<>
			<PageTitle
				title={t('reminders')}
				sub={t('reminderSub')}
				action={
					<IconButton
						icon="plus"
						label={t('newReminder')}
						onClick={() =>
							setModal({
								type: 'reminder',
							})
						}
					/>
				}
			/>
			<p className={bindStyles(styles, "explainer")}>
				<Icon name="bell" size={20} />
				{t('reminderDemo')}
			</p>
			{data.reminders.length ? (
				<div className={bindStyles(styles, "reminder-list")}>
					{[...data.reminders]
						.sort((a, b) => a.date.localeCompare(b.date))
						.map((r) => (
							<article className={bindStyles(styles, "panel reminder-card")} key={r.id}>
								<div className={bindStyles(styles, "section-head")}>
									<span
										className={bindStyles(styles, `tag ${r.date <= today() ? 'blue-tag' : ''}`)}
									>
										{r.date === today()
											? t('today')
											: dateText(r.date, data.lang)}
									</span>
									<span className={bindStyles(styles, "muted")}>{t(r.freq)}</span>
								</div>
								<div className={bindStyles(styles, "reminder-main")}>
									<span className={bindStyles(styles, "category-icon")}>
										<Icon name="bell" />
									</span>
									<div>
										<h3>{data.lang === 'en' && r.en ? r.en : r.title}</h3>
										<small>
											{name(data.categories.find((c) => c.id === r.categoryId))}
										</small>
									</div>
									<strong>{fmt(r.amount, r.currency)}</strong>
								</div>
								<div className={bindStyles(styles, "reminder-channels")}>
									{r.channels.includes('app') && (
										<span>
											<Icon name="bell" size={13} />
											{t('inApp')}
										</span>
									)}
									{r.channels.includes('telegram') && (
										<span>
											<Icon name="plane" size={13} />
											Telegram
										</span>
									)}
								</div>
								<Button
									icon="check"
									className={bindStyles(styles, "wide")}
									onClick={() => handle(r, 'confirm')}
								>
									{t('confirmPayment')}
								</Button>
								<div className={bindStyles(styles, "reminder-actions")}>
									<button onClick={() => handle(r, 'postpone')}>
										{t('postpone')}
									</button>
									<button onClick={() => handle(r, 'skip')}>{t('skip')}</button>
								</div>
							</article>
						))}
				</div>
			) : (
				<div className={bindStyles(styles, "empty")}>
					<Icon name="check" size={36} />
					<h2>{t('noReminders')}</h2>
					<p>{t('noRemindersSub')}</p>
					<Button
						onClick={() =>
							setModal({
								type: 'reminder',
							})
						}
					>
						{t('newReminder')}
					</Button>
				</div>
			)}
		</>
	)
}

export default Reminders;
