import { bindStyles } from '../../styles/bindStyles';
import styles from './brand.module.css';

function Brand() {
	return (
		<span className={bindStyles(styles, "brand")}>
			My<span>Ex</span>
			<i />
		</span>
	)
}

export default Brand;
