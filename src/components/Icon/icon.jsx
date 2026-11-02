import styles from './icon.module.css';

const paths = {
	plus: 'M12 5v14M5 12h14',
	home: 'M3 10l9-7 9 7v10H3zM9 20v-7h6v7',
	list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
	grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
	more: 'M5 12h.01M12 12h.01M19 12h.01',
	arrow: 'M5 12h14M13 6l6 6-6 6',
	chevron: 'M9 5l7 7-7 7',
	back: 'M15 5l-7 7 7 7',
	calendar: 'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16',
	coffee:
		'M4 8h12v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM16 9h2a3 3 0 0 1 0 6h-2M7 2v3M12 2v3',
	car: 'M3 11l2-6h14l2 6v8H3zM3 11h18M6 15h.01M18 15h.01M6 19v2M18 19v2',
	bag: 'M5 7h14l1 14H4zM9 8V5a3 3 0 0 1 6 0v3',
	game: 'M7 7h10l4 10-3 3-4-4h-4l-4 4-3-3zM8 10v4M6 12h4M16 11h.01M18 13h.01',
	check: 'M4 12l5 5L20 6',
	photo: 'M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M16 8h.01',
	wallet: 'M3 6h18v14H3zM3 6l14-3v3M16 11h5v5h-5z',
	bell: 'M5 17V10a7 7 0 0 1 14 0v7l2 2H3zM10 22h4',
	search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
	download: 'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',
	moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12',
	sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
	globe:
		'M3 12h18M12 3c6 6 6 12 0 18M12 3c-6 6-6 12 0 18M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
	edit: 'M15 4l5 5M4 15L16 3l5 5L9 20l-6 1z',
	trash: 'M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
	chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
	settings:
		'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
	close: 'M6 6l12 12M6 18L18 6',
	filter: 'M4 7h16M7 12h10M10 17h4',
	plane: 'M22 2L9 15M22 2l-8 20-5-7-7-5z',
	heart: 'M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 2 11 8 15 6-4 13-10 8-15z',
	logout: 'M9 4H3v16h6M12 12h9M17 8l4 4-4 4',
	lock: 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',
	spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
	clock: 'M12 7v5l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
}
function Icon({ name, size = 22, ...props }) {
	return (
		<svg className={styles.root}
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={name === 'more' ? 3 : 1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			<path d={paths[name] || paths.grid} />
		</svg>
	)
}

export default Icon;
