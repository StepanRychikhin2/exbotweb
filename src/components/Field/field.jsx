import { bindStyles } from '../../styles/bindStyles';
import styles from './field.module.css';

function Field({ label, children, error }) {
	return (
		<label className={styles.root + ' ' + bindStyles(styles, "field")}>
			<span>{label}</span>
			{children}
			{error && (
				<small className={bindStyles(styles, "error")} role="alert">
					{error}
				</small>
			)}
		</label>
	)
}

export default Field;
