import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rangeFor, filtered, dateText, sum } from '../../mivo/model';
import { exportWorkbook } from '../../mivo/export';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import PageTitle from '../PageTitle/pageTitle';
import PeriodControl from '../PeriodControl/periodControl';
import CategoryChart from '../CategoryChart/categoryChart';
import { bindStyles } from '../../styles/bindStyles';
import styles from './reports.module.css';

function Reports() {
	const { data, t, fmt, name, notify } = useApp()
	const [period, setPeriod] = useState('month'),
		[custom, setCustom] = useState({}),
		[categoryId, setCategoryId] = useState(''),
		[busy, setBusy] = useState(false)
	const range = rangeFor(period, custom),
		rows = filtered(data.expenses, {
			currency: data.currency,
			categoryId,
			...range,
		})
	async function download() {
		if (!rows.length) {
			notify(t('noExport'))
			return
		}
		setBusy(true)
		try {
			await exportWorkbook(rows, data.categories, data.lang, range)
			notify(t('exportDone'))
		} catch {
			notify(t('exportError'))
		} finally {
			setBusy(false)
		}
	}
	return (
		<>
			<PageTitle title={t('reports')} sub={t('reportSub')} />
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<label className={bindStyles(styles, "report-category")}>
				{t('category')}
				<select
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
				>
					<option value="">{t('allCategories')}</option>
					{data.categories.map((c) => (
						<option key={c.id} value={c.id}>
							{name(c)}
						</option>
					))}
				</select>
			</label>
			<div className={bindStyles(styles, "report-summary glass")}>
				<span className={bindStyles(styles, "report-icon")}>
					<Icon name="chart" size={28} />
				</span>
				<div>
					<span>
						{dateText(range.from, data.lang)} — {dateText(range.to, data.lang)}
					</span>
					<strong>{fmt(sum(rows))}</strong>
					<small>
						{rows.length} {t('records')} · {data.currency}
					</small>
				</div>
			</div>
			<CategoryChart rows={rows} />
			<section className={bindStyles(styles, "export-panel")}>
				<div className={bindStyles(styles, "file-icon")}>
					<span>X</span>
					<small>XLSX</small>
				</div>
				<div>
					<h3>{t('exportTitle')}</h3>
					<p>{t('exportNote')}</p>
				</div>
				<Button
					icon="download"
					onClick={download}
					disabled={busy || !rows.length}
				>
					{t(busy ? 'exporting' : 'export')}
				</Button>
			</section>
		</>
	)
}

export default Reports;
