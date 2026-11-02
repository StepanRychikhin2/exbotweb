import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import { bindStyles } from '../../styles/bindStyles';
import styles from './empty.module.css';

function Empty({ search = false, action = true }) {
	const { t, go } = useApp()
	return (
		<div className={styles.root + ' ' + bindStyles(styles, "empty")}>
			<span className={bindStyles(styles, "empty-icon")}>
				<Icon name={search ? 'search' : 'coffee'} size={30} />
			</span>
			<h3>{t(search ? 'noResults' : 'noExpenses')}</h3>
			<p>{t(search ? 'noResultsSub' : 'noExpensesSub')}</p>
			{action && (
				<Button icon="plus" secondary onClick={() => go('add')}>
					{t('addTitle')}
				</Button>
			)}
		</div>
	)
}

export default Empty;
