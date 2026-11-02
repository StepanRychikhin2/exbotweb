import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uid } from '../../myex/model';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import Field from '../Field/field';
import { bindStyles } from '../../styles/bindStyles';
import styles from './categoryForm.module.css';

function CategoryForm() {
	const { modal, setModal, data, setData, t, name, notify } = useApp()
	const c = modal.category
	const [title, setTitle] = useState(c ? name(c) : ''),
		[color, setColor] = useState(c?.color || '#90CAF9'),
		[icon, setIcon] = useState(c?.icon || 'coffee'),
		[error, setError] = useState('')
	function submit(e) {
		e.preventDefault()
		const clean = title.trim()
		if (!clean) {
			setError(t('nameRequired'))
			return
		}
		if (
			data.categories.some(
				(x) =>
					x.id !== c?.id &&
					name(x).toLocaleLowerCase() === clean.toLocaleLowerCase(),
			)
		) {
			setError(t('duplicateCategory'))
			return
		}
		const next = {
			...c,
			id: c?.id || uid(),
			customName: clean,
			color,
			icon,
		}
		setData((d) => ({
			...d,
			categories: c
				? d.categories.map((x) => (x.id === c.id ? next : x))
				: [...d.categories, next],
		}))
		setModal(null)
		notify(t('categorySaved'))
	}
	return (
		<form onSubmit={submit}>
			<h2 id="dialog-title">{t(c ? 'edit' : 'newCategory')}</h2>
			<Field label={t('categoryName')} error={error}>
				<input
					autoFocus
					maxLength={40}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
			</Field>
			<fieldset className={bindStyles(styles, "picker-fieldset")}>
				<legend>{t('icon')}</legend>
				<div className={bindStyles(styles, "icon-grid")}>
					{[
						'coffee',
						'car',
						'bag',
						'game',
						'home',
						'plane',
						'heart',
						'grid',
						'wallet',
						'bell',
					].map((i) => (
						<button
							key={i}
							type="button"
							className={bindStyles(styles, icon === i ? 'selected' : '')}
							aria-label={i}
							aria-pressed={icon === i}
							onClick={() => setIcon(i)}
						>
							<Icon name={i} />
						</button>
					))}
				</div>
			</fieldset>
			<fieldset className={bindStyles(styles, "picker-fieldset")}>
				<legend>{t('color')}</legend>
				<div className={bindStyles(styles, "color-grid")}>
					{[
						'#BBDEFB',
						'#90CAF9',
						'#64B5F6',
						'#42A5F5',
						'#2196F3',
						'#6C8AA6',
						'#7D9CAF',
						'#ADB5BD',
					].map((v) => (
						<button
							key={v}
							type="button"
							style={{
								'--swatch': v,
							}}
							className={bindStyles(styles, color === v ? 'selected' : '')}
							aria-label={v}
							aria-pressed={color === v}
							onClick={() => setColor(v)}
						>
							{color === v && <Icon name="check" size={17} />}
						</button>
					))}
				</div>
			</fieldset>
			<Button className={bindStyles(styles, "wide")} type="submit">
				{t('save')}
			</Button>
			{c && (
				<>
					<button
						type="button"
						className={bindStyles(styles, "text-button archive-button")}
						onClick={() => {
							setData((d) => ({
								...d,
								categories: d.categories.map((x) =>
									x.id === c.id
										? {
												...x,
												archived: !x.archived,
											}
										: x,
								),
							}))
							setModal(null)
							notify(t('categorySaved'))
						}}
					>
						{t(c.archived ? 'restore' : 'archive')}
					</button>
					<p className={bindStyles(styles, "form-foot")}>{t('archiveHelp')}</p>
				</>
			)}
		</form>
	)
}

export default CategoryForm;
