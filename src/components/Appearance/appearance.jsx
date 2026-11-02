import { useApp } from '../../context/AppContext';
import IconButton from '../IconButton/iconButton';
import { bindStyles } from '../../styles/bindStyles';
import styles from './appearance.module.css';

function Appearance() {
	const { data, setData, t } = useApp()
	return (
		<div className={bindStyles(styles, "appearance")}>
			<button
				className={bindStyles(styles, "language-button")}
				aria-label={t('language')}
				onClick={() =>
					setData((d) => ({
						...d,
						lang: d.lang === 'uk' ? 'en' : 'uk',
					}))
				}
			>
				{data.lang === 'uk' ? 'UA' : 'EN'}
			</button>
			<IconButton
				icon={data.theme === 'dark' ? 'sun' : 'moon'}
				label={t(data.theme === 'dark' ? 'light' : 'dark')}
				onClick={() =>
					setData((d) => ({
						...d,
						theme: d.theme === 'dark' ? 'light' : 'dark',
					}))
				}
			/>
		</div>
	)
}

export default Appearance;
