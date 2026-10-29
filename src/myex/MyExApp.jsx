import React, {
	useState,
	useEffect,
	useRef,
	useContext,
	createContext,
} from 'react'
import {
	STORE,
	today,
	uid,
	monthOf,
	rangeFor,
	parseMinor,
	minorText,
	money,
	dateText,
	catName,
	parseQuick,
	filtered,
	grouped,
	comparison,
	nextDue,
	readStored,
	shiftDay,
	sum,
} from './model'
import { copy } from './copy'
import { exportWorkbook } from './export'
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
		<svg
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
const Context = createContext(null)
const useApp = () => useContext(Context)
function Brand() {
	return (
		<span className="brand">
			My<span>Ex</span>
			<i />
		</span>
	)
}
function Button({
	children,
	icon,
	secondary = false,
	className = '',
	...props
}) {
	return (
		<button
			className={`button ${secondary ? 'secondary' : 'primary'} ${className}`}
			{...props}
		>
			{icon && <Icon name={icon} size={19} />}
			<span>{children}</span>
		</button>
	)
}
function IconButton({ icon, label, className = '', ...props }) {
	return (
		<button
			className={`icon-button ${className}`}
			aria-label={label}
			title={label}
			{...props}
		>
			<Icon name={icon} />
		</button>
	)
}
function Empty({ search = false, action = true }) {
	const { t, go } = useApp()
	return (
		<div className="empty">
			<span className="empty-icon">
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
function Currency() {
	const { data, setData, t } = useApp()
	return (
		<div className="segmented currency" aria-label={t('currency')}>
			{['UAH', 'USD'].map((c) => (
				<button
					key={c}
					aria-pressed={data.currency === c}
					onClick={() =>
						setData((d) => ({
							...d,
							currency: c,
						}))
					}
				>
					{c}
				</button>
			))}
		</div>
	)
}
function Appearance() {
	const { data, setData, t } = useApp()
	return (
		<div className="appearance">
			<button
				className="language-button"
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
function App() {
	const [data, setData] = useState(readStored)
	const [route, setRoute] = useState(
		() =>
			window.location.hash.slice(1) || (data.authenticated ? 'add' : 'landing'),
	)
	const [modal, setModal] = useState(null)
	const [toast, setToast] = useState(null)
	const titleRef = useRef(null)
	const t = (k) => copy[data.lang][k] || copy.uk[k] || k
	const go = (r) => {
		if (window.location.hash.slice(1) === r) setRoute(r)
		else window.location.hash = r
	}
	useEffect(() => {
		const f = () => {
			setRoute(window.location.hash.slice(1) || 'landing')
			window.scrollTo({
				top: 0,
			})
		}
		window.addEventListener('hashchange', f)
		return () => window.removeEventListener('hashchange', f)
	}, [])
	useEffect(() => {
		document.documentElement.dataset.theme = data.theme
		document.documentElement.lang = data.lang
		try {
			localStorage.setItem(STORE, JSON.stringify(data))
		} catch {
			setToast({
				text: copy[data.lang].storageError,
			})
		}
	}, [data])
	useEffect(() => {
		if (!toast) return
		const id = setTimeout(() => setToast(null), toast.undo ? 10000 : 5000)
		return () => clearTimeout(id)
	}, [toast])
	const notify = (text, undo) =>
		setToast({
			text,
			undo,
		})
	const fmt = (n, c = data.currency) => money(n, c, data.lang)
	const name = (c) => catName(c, data.lang)
	const desc = (e) => (data.lang === 'en' && e.en ? e.en : e.description)
	const start = () =>
		data.authenticated
			? go('add')
			: setModal({
					type: 'login',
				})
	const value = {
		data,
		setData,
		t,
		go,
		route,
		modal,
		setModal,
		notify,
		fmt,
		name,
		desc,
		start,
	}
	const page = route.split('/')[0]
	const isLanding = page === 'landing' || !data.authenticated
	useEffect(() => {
		if (!isLanding)
			titleRef.current?.focus({
				preventScroll: true,
			})
	}, [route, isLanding])
	const sections = {
		add: <AddExpense />,
		overview: <Overview />,
		expenses: <History />,
		categories: <Categories />,
		category: <CategoryDetail id={route.split('/')[1]} />,
		budget: <Budget />,
		reports: <Reports />,
		more: <More />,
		settings: <Settings />,
		reminders: <Reminders />,
	}
	return (
		<Context.Provider value={value}>
			<a
				className="skip-link"
				href="#main-content"
				onClick={(e) => {
					e.preventDefault()
					document.getElementById('main-content')?.focus()
				}}
			>
				{data.lang === 'uk' ? 'До вмісту' : 'Skip to content'}
			</a>
			{isLanding ? (
				<Landing />
			) : (
				<div className="app-shell">
					<Sidebar />
					<div className="workspace">
						<header className="app-top">
							<button
								className="brand-link mobile-brand"
								onClick={() => go('add')}
							>
								<Brand />
							</button>
							<span className="desktop-welcome">{t('demoNotice')}</span>
							<div className="top-tools">
								<Currency />
								<IconButton
									icon="bell"
									label={t('notice')}
									onClick={() => go('reminders')}
								/>
								<button
									className="avatar"
									aria-label={t('profile')}
									onClick={() => go('settings')}
								>
									M
								</button>
							</div>
						</header>
						<main
							id="main-content"
							tabIndex={-1}
							className={`app-main page-${page}`}
							ref={titleRef}
						>
							{sections[page] || <AddExpense />}
						</main>
						<BottomNav />
					</div>
				</div>
			)}
			{modal && (
				<Modal
					key={
						modal.type + '-' + (modal.expense?.id || modal.category?.id || '')
					}
				/>
			)}
			{toast && (
				<div className="toast" role="status">
					<span className="toast-mark">
						<Icon name="check" size={18} />
					</span>
					<span>{toast.text}</span>
					{toast.undo && (
						<button
							onClick={() => {
								toast.undo()
								setToast(null)
							}}
						>
							{t('undo')}
						</button>
					)}
					<IconButton
						icon="close"
						label={t('close')}
						onClick={() => setToast(null)}
					/>
				</div>
			)}
		</Context.Provider>
	)
}
const navs = [
	['overview', 'home'],
	['expenses', 'list'],
	['add', 'plus'],
	['categories', 'grid'],
	['more', 'more'],
]
function Sidebar() {
	const { t, route, go } = useApp()
	return (
		<aside className="sidebar">
			<button className="brand-link" onClick={() => go('landing')}>
				<Brand />
			</button>
			<div className="sidebar-label">{t('demo')}</div>
			<nav aria-label={t('more')}>
				{[
					...navs.filter(([r]) => r !== 'more'),
					['budget', 'wallet'],
					['reports', 'chart'],
					['reminders', 'bell'],
				].map(([r, i]) => (
					<button
						key={r}
						className={`${route.split('/')[0] === r ? 'active' : ''} ${r === 'add' ? 'sidebar-add' : ''}`}
						onClick={() => go(r)}
						aria-current={route.split('/')[0] === r ? 'page' : undefined}
					>
						<Icon name={i} />
						<span>{t(r)}</span>
						{r === 'add' && <span className="key-hint">＋</span>}
					</button>
				))}
			</nav>
			<div className="sidebar-bottom">
				<div className="sidebar-quote">
					<Icon name="coffee" />
					<p>{t('heroFine')}</p>
				</div>
				<button
					className={route === 'settings' ? 'active' : ''}
					onClick={() => go('settings')}
				>
					<Icon name="settings" />
					<span>{t('settings')}</span>
				</button>
				<Appearance />
			</div>
		</aside>
	)
}
function BottomNav() {
	const { t, route, go } = useApp()
	const current = route.split('/')[0]
	return (
		<nav className="bottom-nav" aria-label={t('more')}>
			{navs.map(([r, i]) => (
				<button
					key={r}
					className={`${r === 'add' ? 'nav-add' : ''} ${current === r ? 'active' : ''}`}
					onClick={() => go(r)}
					aria-label={t(r)}
					aria-current={current === r ? 'page' : undefined}
				>
					<span>
						<Icon name={i} />
					</span>
					{r !== 'add' && <small>{t(r)}</small>}
				</button>
			))}
		</nav>
	)
}
function PageTitle({ title, sub, action, back }) {
	const { go, t } = useApp()
	return (
		<div className="page-heading">
			{back && (
				<button className="back-link" onClick={() => go(back)}>
					<Icon name="back" size={18} />
					{t('back')}
				</button>
			)}
			<div>
				<div>
					<p className="eyebrow">
						{new Intl.DateTimeFormat(
							t('today') === 'Today' ? 'en-GB' : 'uk-UA',
							{
								weekday: 'long',
								day: 'numeric',
								month: 'long',
							},
						).format(new Date(today() + 'T12:00:00'))}
					</p>
					<h1>{title}</h1>
					{sub && <p className="subtitle">{sub}</p>}
				</div>
				{action}
			</div>
		</div>
	)
}
function Landing() {
	const { t, start } = useApp()
	return (
		<div className="landing">
			<header className="landing-header">
				<button
					className="brand-link"
					onClick={() =>
						window.scrollTo({
							top: 0,
							behavior: 'smooth',
						})
					}
				>
					<Brand />
				</button>
				<nav>
					<a
						href="#features"
						onClick={(e) => {
							e.preventDefault()
							document.getElementById('features')?.scrollIntoView({
								behavior: 'smooth',
							})
						}}
					>
						{t('features')}
					</a>
					<a
						href="#how"
						onClick={(e) => {
							e.preventDefault()
							document.getElementById('how')?.scrollIntoView({
								behavior: 'smooth',
							})
						}}
					>
						{t('how')}
					</a>
					<a
						href="#pricing"
						onClick={(e) => {
							e.preventDefault()
							document.getElementById('pricing')?.scrollIntoView({
								behavior: 'smooth',
							})
						}}
					>
						{t('pricing')}
					</a>
				</nav>
				<div className="header-actions">
					<Appearance />
					<Button secondary onClick={start}>
						{t('login')}
					</Button>
				</div>
			</header>
			<main id="main-content" tabIndex={-1}>
				<section className="hero">
					<div className="hero-copy">
						<p className="eyebrow">
							<span className="blue-dot" />
							{t('heroLabel')}
						</p>
						<h1>
							{t('heroA')}
							<br />
							<span>{t('heroB')}</span>
						</h1>
						<p className="hero-sub">{t('heroSub')}</p>
						<Button onClick={start} icon="arrow">
							{t('login')}
						</Button>
						<p className="hero-fine">
							<Icon name="check" size={15} />
							{t('heroFine')}
						</p>
					</div>
					<div className="hero-visual">
						<div className="orbit orbit-one" />
						<div className="orbit orbit-two" />
						<HeroPhone />
						<div className="floating-note">
							<span className="note-icon">
								<Icon name="check" />
							</span>
							<span>
								<strong>{t('added')}</strong>
								<small>{t('miniHint')}</small>
							</span>
						</div>
						<div className="tiny-note">
							<span className="blue-dot" />
							Telegram + web
						</div>
					</div>
				</section>
				<section id="how" className="landing-section steps-section">
					<p className="eyebrow">{t('how')}</p>
					<h2>
						{t('stepTitle')} <span>{t('stepSub')}</span>
					</h2>
					<div className="steps">
						{[1, 2, 3].map((n) => (
							<div key={n} className="step">
								<span className="step-number">0{n}</span>
								<h3>{t('step' + n)}</h3>
								<p>{t('step' + n + 'body')}</p>
							</div>
						))}
					</div>
				</section>
				<section id="features" className="landing-section feature-section">
					<div className="feature-visual">
						<div className="feature-chart panel glass">
							<div className="section-head">
								<h3>{t('whereMoney')}</h3>
								<span className="tag">UAH</span>
							</div>
							<HeroBars />
							<div className="feature-foot">
								<Icon name="chart" />
								<span>{t('monthLabel')}</span>
							</div>
						</div>
						<div className="feature-budget panel">
							<div>
								<Icon name="wallet" />
								<span>{t('budget')}</span>
							</div>
							<strong>
								62<span>%</span>
							</strong>
							<div className="progress">
								<i
									style={{
										width: '62%',
									}}
								/>
							</div>
						</div>
					</div>
					<div>
						<p className="eyebrow">{t('features')}</p>
						<h2>
							{t('featureTitle')}
							<br />
							<span>{t('featureTitle2')}</span>
						</h2>
						<p className="section-sub">{t('featureSub')}</p>
						<div className="feature-list">
							{['list', 'chart', 'wallet'].map((icon, i) => (
								<div key={icon}>
									<span className="feature-icon">
										<Icon name={icon} />
									</span>
									<div>
										<h3>{t('feature' + (i + 1))}</h3>
										<p>{t('feature' + (i + 1) + 'body')}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
				<section id="pricing" className="landing-section pricing-section">
					<p className="eyebrow">{t('pricing')}</p>
					<h2>{t('pricingTitle')}</h2>
					<p className="section-sub">{t('pricingSub')}</p>
					<div className="pricing-grid">
						<article className="price-card">
							<Icon name="coffee" size={28} />
							<h3>{t('free')}</h3>
							<p>{t('freeBody')}</p>
							<Button onClick={start}>{t('login')}</Button>
						</article>
						<article className="price-card muted-price">
							<span className="tag">{t('soon')}</span>
							<Icon name="spark" size={28} />
							<h3>{t('paidPlan')}</h3>
							<p>{t('paidBody')}</p>
							<Button secondary disabled>
								{t('soon')}
							</Button>
						</article>
					</div>
					<p className="pricing-note">{t('tierNote')}</p>
				</section>
				<section className="landing-section faq-section">
					<h2>{t('faq')}</h2>
					<div>
						{[1, 2, 3, 4].map((n) => (
							<details key={n}>
								<summary>
									{t('faq' + n)}
									<Icon name="plus" size={19} />
								</summary>
								<p>{t('faq' + n + 'body')}</p>
							</details>
						))}
					</div>
				</section>
				<section className="landing-section final-cta">
					<span className="final-icon">
						<Icon name="coffee" size={30} />
					</span>
					<h2>{t('finalTitle')}</h2>
					<p>{t('finalSub')}</p>
					<Button icon="arrow" onClick={start}>
						{t('login')}
					</Button>
				</section>
			</main>
			<footer className="landing-footer">
				<Brand />
				<span>{t('footer')}</span>
				<span>© {new Date().getFullYear()} MyEx</span>
			</footer>
		</div>
	)
}
function HeroBars() {
	const { t } = useApp()
	return (
		<div className="hero-bars">
			{[
				['food', 5250, 100],
				['shopping', 2900, 55],
				['transport', 2180, 42],
				['games', 1450, 28],
			].map(([id, v, w]) => (
				<div key={id}>
					<div>
						<span>
							{copy[t('today') === 'Today' ? 'en' : 'uk'][id] ||
								{
									food: t('today') === 'Today' ? 'Food' : 'Їжа',
									shopping: t('today') === 'Today' ? 'Shopping' : 'Покупки',
									transport: t('today') === 'Today' ? 'Transport' : 'Транспорт',
									games: t('today') === 'Today' ? 'Games' : 'Ігри',
								}[id]}
						</span>
						<strong>{v.toLocaleString('uk-UA')} ₴</strong>
					</div>
					<div className="progress">
						<i
							style={{
								width: w + '%',
							}}
						/>
					</div>
				</div>
			))}
		</div>
	)
}
function HeroPhone() {
	const { t } = useApp()
	return (
		<div className="hero-phone" aria-label={t('heroCardLabel')}>
			<div className="phone-top">
				<Brand />
				<span className="tag">UAH</span>
			</div>
			<p className="eyebrow">{t('todaySpent')}</p>
			<div className="phone-total">
				894 <span>₴</span>
			</div>
			<div className="phone-stats">
				<span>
					{t('monthSpent')}
					<strong>12 480 ₴</strong>
				</span>
				<span>
					{t('dailyAverage')}
					<strong>445,71 ₴</strong>
				</span>
			</div>
			<div className="phone-chart">
				<div className="section-head">
					<h3>{t('whereMoney')}</h3>
					<Icon name="more" size={20} />
				</div>
				<HeroBars />
			</div>
			<div className="phone-bottom">
				{['home', 'list', 'plus', 'grid', 'more'].map((n) => (
					<span key={n} className={n === 'plus' ? 'phone-plus' : ''}>
						<Icon name={n} size={19} />
					</span>
				))}
			</div>
		</div>
	)
}
function ExpenseRows({ rows, groupDays = false, onSelect }) {
	const { data, t, fmt, name, desc, setModal } = useApp()
	const sorted = [...rows].sort(
		(a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
	)
	let prior = ''
	return (
		<div className="expense-list">
			{sorted.map((e) => {
				const show = groupDays && prior !== e.date
				prior = e.date
				const c = data.categories.find((c) => c.id === e.categoryId)
				return (
					<React.Fragment key={e.id}>
						{show && (
							<div className="day-heading">
								<span>
									{e.date === today()
										? t('today')
										: dateText(e.date, data.lang)}
								</span>
								<strong>
									{fmt(sum(rows.filter((r) => r.date === e.date)))}
								</strong>
							</div>
						)}
						<button
							className="expense-row"
							onClick={() =>
								onSelect
									? onSelect(e)
									: setModal({
											type: 'expense',
											expense: e,
										})
							}
						>
							<span
								className="category-icon"
								style={{
									'--category': c?.color || '#ADB5BD',
								}}
							>
								<Icon name={c?.icon} />
							</span>
							<span className="expense-text">
								<strong>{desc(e)}</strong>
								<small>
									{name(c)}
									{e.receipt && <Icon name="photo" size={12} />}
								</small>
							</span>
							<strong className="expense-amount">
								{fmt(e.amount, e.currency)}
							</strong>
							<Icon name="chevron" size={15} />
						</button>
					</React.Fragment>
				)
			})}
		</div>
	)
}
function AddExpense() {
	const { data, t, fmt, setModal } = useApp()
	const [text, setText] = useState('')
	const [error, setError] = useState('')
	const quick = parseQuick(text, data.categories)
	const rows = filtered(data.expenses, {
		currency: data.currency,
		from: today(),
		to: today(),
	})
	const cat = data.categories.find((c) => c.id === quick?.categoryId)
	function review(e) {
		e.preventDefault()
		if (!quick) {
			setError(t('badQuick'))
			return
		}
		setError('')
		setModal({
			type: 'expense',
			draft: {
				...quick,
				date: today(),
				currency: data.currency,
			},
			afterSave: () => setText(''),
		})
	}
	return (
		<>
			<PageTitle title={t('addTitle')} sub={t('addSub')} />
			<div className="add-layout">
				<div className="add-form-column">
					<form onSubmit={review}>
						<div className="quick-card glass">
							<label htmlFor="quick-expense">{t('quickLabel')}</label>
							<input
								id="quick-expense"
								className="quick-input"
								value={text}
								maxLength={300}
								onChange={(e) => {
									setText(e.target.value)
									setError('')
								}}
								placeholder={t('quickPlaceholder')}
								autoComplete="off"
								aria-invalid={!!error}
								aria-describedby={error ? 'quick-error' : undefined}
							/>
							<div className="quick-meta">
								{cat ? (
									<span className="recognized">
										<Icon name={cat.icon} size={15} />
										{catName(cat, data.lang)}
									</span>
								) : (
									<span>
										<Icon name="coffee" size={15} />
										{t('category')}
									</span>
								)}
								<span>
									{t('today')} · {data.currency}
								</span>
							</div>
						</div>
						{error && (
							<p id="quick-error" className="error" role="alert">
								{error}
							</p>
						)}
						<Button className="wide" icon="arrow" type="submit">
							{t('review')}
						</Button>
					</form>
					<button
						className="category-entry"
						onClick={() =>
							setModal({
								type: 'chooseCategory',
							})
						}
					>
						<Icon name="grid" />
						<span>{t('byCategory')}</span>
						<Icon name="chevron" size={18} />
					</button>
					<div className="quiet-note">
						<Icon name="photo" size={19} />
						<span>{t('scan')}</span>
						<span className="tag">{t('soon')}</span>
					</div>
					<p className="add-motto">{t('heroFine')}</p>
				</div>
				<section className="recent-panel">
					<div className="section-head">
						<h2>{t('today')}</h2>
						<strong className="section-total">{fmt(sum(rows))}</strong>
					</div>
					{rows.length ? (
						<ExpenseRows rows={rows.slice(-5)} />
					) : (
						<Empty action={false} />
					)}
					<div className="desktop-only tip-panel">
						<Icon name="check" />
						<p>{t('confirmSub')}</p>
					</div>
				</section>
			</div>
		</>
	)
}
function PeriodControl({ period, setPeriod, custom, setCustom }) {
	const { t, setModal } = useApp()
	return (
		<div className="period-control">
			{['today', 'week', 'month'].map((p) => (
				<button
					className={period === p ? 'active' : ''}
					aria-pressed={period === p}
					key={p}
					onClick={() => setPeriod(p)}
				>
					{t(p)}
				</button>
			))}
			<button
				className={period === 'custom' ? 'active' : ''}
				onClick={() =>
					setModal({
						type: 'period',
						custom,
						onApply: (v) => {
							setCustom(v)
							setPeriod('custom')
						},
					})
				}
			>
				<Icon name="calendar" size={16} />
				{t('custom')}
			</button>
		</div>
	)
}
function CategoryChart({ rows, initial = 'bars' }) {
	const { data, t, name, fmt, go } = useApp()
	const [mode, setMode] = useState(initial),
		[selected, setSelected] = useState(null)
	const groups = grouped(rows, data.categories),
		total = sum(rows)
	let pos = 0
	const stops = groups
		.map((g) => {
			const from = pos
			pos += (g.amount / total) * 100
			return `${g.category?.color || '#ADB5BD'} ${from}% ${pos}%`
		})
		.join(',')
	return (
		<section className="panel category-chart">
			<div className="section-head">
				<h2>{t('whereMoney')}</h2>
				<div className="segmented chart-switch">
					{['bars', 'donut'].map((m) => (
						<button
							key={m}
							aria-pressed={mode === m}
							onClick={() => setMode(m)}
						>
							{t(m)}
						</button>
					))}
				</div>
			</div>
			{!total ? (
				<Empty action={false} />
			) : (
				<>
					<div className={mode === 'donut' ? 'donut-layout' : 'bars-layout'}>
						{mode === 'donut' && (
							<div
								className="donut"
								role="img"
								aria-label={groups
									.map((g) => `${name(g.category)} ${fmt(g.amount)}`)
									.join(', ')}
								style={{
									background: `conic-gradient(${stops})`,
								}}
							>
								<div>
									<small>
										{selected
											? name(data.categories.find((c) => c.id === selected))
											: t('total')}
									</small>
									<strong>
										{fmt(
											selected
												? groups.find((g) => g.category?.id === selected)
														?.amount || 0
												: total,
										)}
									</strong>
								</div>
							</div>
						)}
						<div className="category-bars">
							{groups.map((g) => (
								<div className="category-bar" key={g.category?.id}>
									<button
										className="bar-main"
										onClick={() =>
											mode === 'donut'
												? setSelected(
														selected === g.category?.id ? null : g.category?.id,
													)
												: go('category/' + g.category?.id)
										}
									>
										<span className="bar-label">
											<i
												style={{
													background: g.category?.color,
												}}
											/>
											{name(g.category)}
										</span>
										<span>
											<strong>{fmt(g.amount)}</strong>
											<small>{Math.round((g.amount / total) * 100)}%</small>
										</span>
									</button>
									{mode === 'bars' && (
										<div className="progress">
											<i
												style={{
													width: `${(g.amount / groups[0].amount) * 100}%`,
													background: g.category?.color,
												}}
											/>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
					{mode === 'donut' && selected && (
						<button
							className="text-button"
							onClick={() => go('category/' + selected)}
						>
							{name(data.categories.find((c) => c.id === selected))}
							<Icon name="arrow" size={17} />
						</button>
					)}
				</>
			)}
		</section>
	)
}
function LineChart({ rows, from, to }) {
	const { t, fmt, data } = useApp()
	const ref = useRef(null)
	const [width, setWidth] = useState(400)
	const [chosen, setChosen] = useState(null)
	useEffect(() => {
		const o = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
		if (ref.current) o.observe(ref.current)
		return () => o.disconnect()
	}, [])
	const dayCount = Math.max(
		1,
		Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1,
	)
	const step = Math.max(1, Math.ceil(dayCount / 366))
	const dates = []
	for (let d = from; d <= to; d = shiftDay(d, step)) dates.push(d)
	const ends = dates.map((d) =>
		shiftDay(d, step - 1) > to ? to : shiftDay(d, step - 1),
	)
	const values = dates.map((d, i) =>
		sum(rows.filter((r) => r.date >= d && r.date <= ends[i])),
	)
	const high = Math.max(...values, 100)
	const h = 190,
		left = 45,
		right = 14,
		top = 16,
		bottom = 30
	const x = (i) =>
		left +
		(dates.length < 2
			? (width - left - right) / 2
			: (i / (dates.length - 1)) * (width - left - right))
	const y = (v) => h - bottom - (v / high) * (h - bottom - top)
	const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
	const chosenIndex = Math.max(
		0,
		dates.indexOf(chosen) < 0 ? dates.length - 1 : dates.indexOf(chosen),
	)
	return (
		<section className="panel line-panel">
			<div className="section-head">
				<h2>{t('yourRhythm')}</h2>
				<span className="muted">{data.currency}</span>
			</div>
			<div ref={ref} className="line-chart">
				<svg
					viewBox={`0 0 ${width} ${h}`}
					role="img"
					aria-label={t('yourRhythm')}
					onPointerDown={(e) => {
						const b = e.currentTarget.getBoundingClientRect()
						const i = Math.max(
							0,
							Math.min(
								dates.length - 1,
								Math.round(
									((((e.clientX - b.left) / b.width) * width - left) /
										(width - left - right)) *
										(dates.length - 1),
								),
							),
						)
						setChosen(dates[i])
					}}
				>
					{[0, 0.5, 1].map((k) => (
						<g key={k}>
							<line
								x1={left}
								y1={y(high * k)}
								x2={width - right}
								y2={y(high * k)}
								className="chart-grid"
							/>
							<text x={left - 8} y={y(high * k) + 4} textAnchor="end">
								{Math.round((high * k) / 100)}
							</text>
						</g>
					))}
					{dates
						.filter(
							(d, i) =>
								i === 0 ||
								i === dates.length - 1 ||
								i === Math.floor(dates.length / 3) ||
								i === Math.floor((dates.length * 2) / 3),
						)
						.map((d) => (
							<text
								key={d}
								x={x(dates.indexOf(d))}
								y={h - 5}
								textAnchor="middle"
							>
								{from.slice(0, 7) === to.slice(0, 7)
									? d.slice(8)
									: d.slice(5).replace('-', '/')}
							</text>
						))}
					{values.length > 1 && (
						<path
							d={
								path +
								` L${x(values.length - 1)},${h - bottom} L${x(0)},${h - bottom} Z`
							}
							className="chart-area"
						/>
					)}
					<path d={path} className="chart-path" />
					{values.length > 0 && (
						<>
							<line
								x1={x(chosenIndex)}
								y1={top}
								x2={x(chosenIndex)}
								y2={h - bottom}
								className="chart-guide"
							/>
							<circle
								cx={x(chosenIndex)}
								cy={y(values[chosenIndex] || 0)}
								r="5"
								className="chart-dot"
							/>
						</>
					)}
				</svg>
			</div>
			<div className="chart-caption">
				<label>
					{t(step > 1 ? 'period' : 'day')}
					<select
						value={dates[chosenIndex] || ''}
						onChange={(e) => setChosen(e.target.value)}
					>
						{dates.map((d, i) => (
							<option value={d} key={d}>
								{dateText(d, data.lang)}
								{step > 1 ? ' — ' + dateText(ends[i], data.lang) : ''}
							</option>
						))}
					</select>
				</label>
				<strong>{fmt(values[chosenIndex] || 0)}</strong>
			</div>
		</section>
	)
}
function Comparison({ categoryId = '' }) {
	const { data, t } = useApp()
	const c = comparison(data.expenses, data.currency, categoryId)
	return (
		<div className="comparison">
			<Icon name="chart" />
			<div>
				<strong>
					{c.percent === null
						? t('noComparison')
						: c.percent === 0
							? t('same')
							: `${Math.abs(c.percent)}% ${t(c.percent < 0 ? 'less' : 'moreSpent')}`}
				</strong>
				<span>{t('comparison')}</span>
				<small>
					{t('sameDays')}: {dateText(c.prevFrom, data.lang)} –{' '}
					{dateText(c.prevTo, data.lang)}
				</small>
			</div>
		</div>
	)
}
function Overview() {
	const { data, t, fmt, go } = useApp()
	const [period, setPeriod] = useState('today'),
		[custom, setCustom] = useState({})
	const range = rangeFor(period, custom)
	const rows = filtered(data.expenses, {
		currency: data.currency,
		...range,
	})
	const monthRows = filtered(data.expenses, {
		currency: data.currency,
		from: monthOf(today()) + '-01',
		to: today(),
	})
	return (
		<>
			<PageTitle title={t('overview')} sub={t('overviewSub')} />
			<section className="summary-card glass">
				<div className="main-stat">
					<span>{t('todaySpent')}</span>
					<strong>
						{fmt(
							sum(
								filtered(data.expenses, {
									currency: data.currency,
									from: today(),
									to: today(),
								}),
							),
						)}
					</strong>
					<span className="stat-note">
						<i className="blue-dot" />
						{t('heroFine')}
					</span>
				</div>
				<div className="secondary-stats">
					<div>
						<span>{t('monthSpent')}</span>
						<strong>{fmt(sum(monthRows))}</strong>
					</div>
					<div>
						<span title={t('dailyAverageHelp')}>{t('dailyAverage')}</span>
						<strong>
							{fmt(Math.round(sum(monthRows) / Number(today().slice(8))))}
						</strong>
					</div>
				</div>
			</section>
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<div className="analytics-grid">
				<CategoryChart rows={rows} />
				<LineChart rows={rows} {...range} />
			</div>
			<Comparison />
			<div className="section-head recent-head">
				<h2>{t('recent')}</h2>
				<button className="text-button" onClick={() => go('expenses')}>
					{t('seeAll')}
					<Icon name="arrow" size={17} />
				</button>
			</div>
			<ExpenseRows
				rows={filtered(data.expenses, {
					currency: data.currency,
				}).slice(-4)}
			/>
		</>
	)
}
function History() {
	const { data, t, fmt, setModal } = useApp()
	const [query, setQuery] = useState(''),
		[filters, setFilters] = useState({})
	const rows = filtered(data.expenses, {
		currency: data.currency,
		query,
		...filters,
	})
	const active = Object.values(filters).filter(Boolean).length
	return (
		<>
			<PageTitle title={t('expenses')} sub={t('historySub')} />
			<div className="history-tools">
				<label className="search-box">
					<Icon name="search" size={20} />
					<input
						value={query}
						placeholder={t('search')}
						aria-label={t('search')}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</label>
				<button
					className={`filter-button ${active ? 'selected' : ''}`}
					onClick={() =>
						setModal({
							type: 'filters',
							filters,
							onApply: setFilters,
						})
					}
				>
					<Icon name="filter" />
					<span>{t('filters')}</span>
					{active > 0 && <b>{active}</b>}
				</button>
			</div>
			{active > 0 && (
				<div className="active-filters">
					<span>
						{filters.from && dateText(filters.from, data.lang)}
						{filters.to && ' — ' + dateText(filters.to, data.lang)}
						{filters.categoryId &&
							' · ' +
								catName(
									data.categories.find((c) => c.id === filters.categoryId),
									data.lang,
								)}
					</span>
					<button className="text-button" onClick={() => setFilters({})}>
						{t('reset')}
						<Icon name="close" size={14} />
					</button>
				</div>
			)}
			<div className="history-total">
				<span>
					{rows.length} {t('records')}
				</span>
				<strong>{fmt(sum(rows))}</strong>
			</div>
			{rows.length ? (
				<ExpenseRows rows={rows} groupDays />
			) : (
				<Empty search={!!query || !!active} />
			)}
		</>
	)
}
function Categories() {
	const { data, t, fmt, name, go, setModal } = useApp()
	const [archived, setArchived] = useState(false)
	const [period, setPeriod] = useState('month'),
		[custom, setCustom] = useState({})
	const rows = filtered(data.expenses, {
		currency: data.currency,
		...rangeFor(period, custom),
	})
	const cats = data.categories.filter((c) => Boolean(c.archived) === archived)
	return (
		<>
			<PageTitle
				title={t('categories')}
				sub={t('categorySub')}
				action={
					<IconButton
						icon="plus"
						label={t('newCategory')}
						onClick={() =>
							setModal({
								type: 'category',
							})
						}
					/>
				}
			/>
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<div className="section-head">
				<div className="segmented">
					<button aria-pressed={!archived} onClick={() => setArchived(false)}>
						{t('active')}
					</button>
					<button aria-pressed={archived} onClick={() => setArchived(true)}>
						{t('archived')}
					</button>
				</div>
			</div>
			<div className="category-grid">
				{cats.map((c) => {
					const total = sum(rows.filter((r) => r.categoryId === c.id))
					return (
						<button
							className="category-tile"
							key={c.id}
							onClick={() => go('category/' + c.id)}
						>
							<span
								className="category-icon"
								style={{
									'--category': c.color,
								}}
							>
								<Icon name={c.icon} size={26} />
							</span>
							<Icon name="chevron" size={16} />
							<h3>{name(c)}</h3>
							<strong>{fmt(total)}</strong>
							<span className="muted">
								{rows.filter((r) => r.categoryId === c.id).length}{' '}
								{t('records')}
							</span>
						</button>
					)
				})}
				<button
					className="category-tile new-category"
					onClick={() =>
						setModal({
							type: 'category',
						})
					}
				>
					<span className="category-icon">
						<Icon name="plus" size={26} />
					</span>
					<h3>{t('newCategory')}</h3>
				</button>
			</div>
		</>
	)
}
function CategoryDetail({ id }) {
	const { data, t, name, fmt, setModal } = useApp()
	const [period, setPeriod] = useState('month'),
		[custom, setCustom] = useState({})
	const category = data.categories.find((c) => c.id === id)
	if (!category) return <Empty />
	const range = rangeFor(period, custom)
	const rows = filtered(data.expenses, {
		currency: data.currency,
		categoryId: id,
		...range,
	})
	return (
		<>
			<PageTitle
				back="categories"
				title={name(category)}
				sub={category.archived ? t('archived') : t('categorySub')}
				action={
					<IconButton
						icon="edit"
						label={t('edit')}
						onClick={() =>
							setModal({
								type: 'category',
								category,
							})
						}
					/>
				}
			/>
			<div className="category-total">
				<span
					className="category-icon"
					style={{
						'--category': category.color,
					}}
				>
					<Icon name={category.icon} size={30} />
				</span>
				<div>
					<small>{t('total')}</small>
					<strong>{fmt(sum(rows))}</strong>
				</div>
				{!category.archived && (
					<IconButton
						icon="plus"
						label={t('addTitle')}
						onClick={() =>
							setModal({
								type: 'expense',
								draft: {
									categoryId: id,
									currency: data.currency,
									date: today(),
								},
							})
						}
					/>
				)}
			</div>
			<PeriodControl
				{...{
					period,
					setPeriod,
					custom,
					setCustom,
				}}
			/>
			<LineChart rows={rows} {...range} />
			<Comparison categoryId={id} />
			<div className="section-head">
				<h2>{t('expenses')}</h2>
				<span className="muted">
					{rows.length} {t('records')}
				</span>
			</div>
			{rows.length ? (
				<ExpenseRows rows={rows} groupDays />
			) : (
				<Empty action={!category.archived} />
			)}
		</>
	)
}
function Budget() {
	const { data, t, fmt, setModal } = useApp()
	const [month, setMonth] = useState(monthOf(today()))
	const key = month + '|' + data.currency,
		limit = data.budgets[key] || 0,
		used = sum(
			filtered(data.expenses, {
				currency: data.currency,
				from: month + '-01',
				to: month + '-31',
			}),
		),
		remaining = limit - used,
		percent = limit ? Math.round((used / limit) * 100) : 0
	return (
		<>
			<PageTitle title={t('budget')} sub={t('budgetSub')} />
			<label className="month-picker">
				<Icon name="calendar" />
				<span>{t('monthPick')}</span>
				<input
					type="month"
					value={month}
					onChange={(e) => e.target.value && setMonth(e.target.value)}
					aria-label={t('monthPick')}
				/>
			</label>
			{limit ? (
				<section className="budget-card glass">
					<div className="section-head">
						<span>{t('limit')}</span>
						<IconButton
							icon="edit"
							label={t('editBudget')}
							onClick={() =>
								setModal({
									type: 'budget',
									month,
									limit,
								})
							}
						/>
					</div>
					<div className="budget-limit">{fmt(limit)}</div>
					<div className="budget-progress-label">
						<span>{t('spent')}</span>
						<strong>
							{percent}% {t('used')}
						</strong>
					</div>
					<div
						className={`progress budget-progress ${remaining < 0 ? 'danger-progress' : ''}`}
						role="progressbar"
						aria-label={t('budget')}
						aria-valuenow={Math.min(percent, 100)}
						aria-valuemin={0}
						aria-valuemax={100}
					>
						<i
							style={{
								width: Math.min(percent, 100) + '%',
							}}
						/>
					</div>
					<div className="budget-numbers">
						<div>
							<span>{t('spent')}</span>
							<strong>{fmt(used)}</strong>
						</div>
						<div className={remaining < 0 ? 'danger-text' : ''}>
							<span>{t(remaining < 0 ? 'overBudget' : 'remaining')}</span>
							<strong>{fmt(Math.abs(remaining))}</strong>
						</div>
					</div>
					<div
						className={`budget-status ${remaining < 0 ? 'danger-text' : ''}`}
					>
						<Icon name={remaining < 0 ? 'bell' : 'check'} />
						{t(remaining < 0 ? 'overBudget' : 'budgetGood')}
					</div>
				</section>
			) : (
				<div className="panel empty">
					<span className="empty-icon">
						<Icon name="wallet" size={32} />
					</span>
					<h2>{t('noBudget')}</h2>
					<p>{t('noBudgetSub')}</p>
					<Button
						onClick={() =>
							setModal({
								type: 'budget',
								month,
								limit: 0,
							})
						}
					>
						{t('setBudget')}
					</Button>
				</div>
			)}
			<p className="explainer">
				<Icon name="wallet" size={20} />
				{t('budgetCurrencies')}
			</p>
			<CategoryChart
				rows={filtered(data.expenses, {
					currency: data.currency,
					from: month + '-01',
					to: month + '-31',
				})}
			/>
		</>
	)
}
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
			<label className="report-category">
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
			<div className="report-summary glass">
				<span className="report-icon">
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
			<section className="export-panel">
				<div className="file-icon">
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
function More() {
	const { t, go } = useApp()
	return (
		<>
			<PageTitle title={t('more')} sub={t('preferences')} />
			<div className="more-profile">
				<span className="avatar large">M</span>
				<div>
					<h2>{t('demoProfile')}</h2>
					<span className="muted">Telegram · {t('demo')}</span>
				</div>
			</div>
			<div className="menu-list">
				{[
					['budget', 'wallet'],
					['reports', 'chart'],
					['reminders', 'bell'],
					['settings', 'settings'],
				].map(([r, i]) => (
					<button onClick={() => go(r)} key={r}>
						<span className="menu-icon">
							<Icon name={i} />
						</span>
						<span>{t(r)}</span>
						<Icon name="chevron" size={18} />
					</button>
				))}
			</div>
			<div className="plan-card">
				<Icon name="coffee" />
				<div>
					<strong>MyEx {t('free')}</strong>
					<p>{t('planSoon')}</p>
				</div>
				<span className="tag">{t('demo')}</span>
			</div>
		</>
	)
}
function Settings() {
	const { data, setData, t, go } = useApp()
	return (
		<>
			<PageTitle title={t('settings')} sub={t('preferences')} />
			<div className="more-profile">
				<span className="avatar large">M</span>
				<div>
					<h2>{t('demoProfile')}</h2>
					<span className="muted">Telegram · {t('demo')}</span>
				</div>
			</div>
			<div className="settings-panel">
				<div className="settings-row">
					<span>
						<Icon name="globe" />
						{t('language')}
					</span>
					<div className="segmented">
						<button
							aria-pressed={data.lang === 'uk'}
							onClick={() =>
								setData((d) => ({
									...d,
									lang: 'uk',
								}))
							}
						>
							Українська
						</button>
						<button
							aria-pressed={data.lang === 'en'}
							onClick={() =>
								setData((d) => ({
									...d,
									lang: 'en',
								}))
							}
						>
							English
						</button>
					</div>
				</div>
				<div className="settings-row">
					<span>
						<Icon name="moon" />
						{t('theme')}
					</span>
					<div className="segmented">
						{['dark', 'light'].map((theme) => (
							<button
								key={theme}
								aria-pressed={data.theme === theme}
								onClick={() =>
									setData((d) => ({
										...d,
										theme,
									}))
								}
							>
								{t(theme)}
							</button>
						))}
					</div>
				</div>
				<div className="settings-row">
					<span>
						<Icon name="wallet" />
						{t('defaultCurrency')}
					</span>
					<Currency />
				</div>
				<button
					className="settings-row row-button"
					onClick={() => go('reminders')}
				>
					<span>
						<Icon name="bell" />
						{t('reminders')}
					</span>
					<Icon name="chevron" size={18} />
				</button>
				<div className="settings-row">
					<span>
						<Icon name="coffee" />
						{t('plan')}
					</span>
					<span>{t('free')}</span>
				</div>
			</div>
			<p className="explainer">
				<Icon name="lock" size={20} />
				{t('localNote')}
			</p>
			<button
				className="logout-button"
				onClick={() => {
					setData((d) => ({
						...d,
						authenticated: false,
					}))
					go('landing')
				}}
			>
				<Icon name="logout" size={20} />
				{t('logout')}
			</button>
		</>
	)
}
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
			<p className="explainer">
				<Icon name="bell" size={20} />
				{t('reminderDemo')}
			</p>
			{data.reminders.length ? (
				<div className="reminder-list">
					{[...data.reminders]
						.sort((a, b) => a.date.localeCompare(b.date))
						.map((r) => (
							<article className="panel reminder-card" key={r.id}>
								<div className="section-head">
									<span
										className={`tag ${r.date <= today() ? 'blue-tag' : ''}`}
									>
										{r.date === today()
											? t('today')
											: dateText(r.date, data.lang)}
									</span>
									<span className="muted">{t(r.freq)}</span>
								</div>
								<div className="reminder-main">
									<span className="category-icon">
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
								<div className="reminder-channels">
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
									className="wide"
									onClick={() => handle(r, 'confirm')}
								>
									{t('confirmPayment')}
								</Button>
								<div className="reminder-actions">
									<button onClick={() => handle(r, 'postpone')}>
										{t('postpone')}
									</button>
									<button onClick={() => handle(r, 'skip')}>{t('skip')}</button>
								</div>
							</article>
						))}
				</div>
			) : (
				<div className="empty">
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
function Field({ label, children, error }) {
	return (
		<label className="field">
			<span>{label}</span>
			{children}
			{error && (
				<small className="error" role="alert">
					{error}
				</small>
			)}
		</label>
	)
}
function Modal() {
	const { modal, setModal, t } = useApp()
	const ref = useRef(null)
	useEffect(() => {
		const previous = document.activeElement
		const dialog = ref.current
		dialog.showModal()
		return () => {
			if (dialog.open) dialog.close()
			previous?.focus?.()
		}
	}, [])
	const contents = {
		login: <Login />,
		expense: <ExpenseForm />,
		chooseCategory: <ChooseCategory />,
		category: <CategoryForm />,
		period: <PeriodForm />,
		filters: <FiltersForm />,
		budget: <BudgetForm />,
		reminder: <ReminderForm />,
		delete: <DeleteForm />,
	}
	return (
		<dialog
			className={`modal modal-${modal.type}`}
			ref={ref}
			aria-labelledby="dialog-title"
			onCancel={(e) => {
				e.preventDefault()
				setModal(null)
			}}
			onClick={(e) => {
				if (e.target === ref.current) setModal(null)
			}}
		>
			<div className="modal-inner">
				<div className="sheet-handle" />
				<IconButton
					icon="close"
					label={t('close')}
					className="modal-close"
					onClick={() => setModal(null)}
				/>
				{contents[modal.type]}
			</div>
		</dialog>
	)
}
function Login() {
	const { setData, t, setModal, go } = useApp()
	return (
		<div className="login-modal">
			<span className="login-icon">
				<Icon name="plane" size={34} />
			</span>
			<span className="tag">{t('demo')}</span>
			<h2 id="dialog-title">{t('loginTitle')}</h2>
			<p>{t('loginSub')}</p>
			<Button
				className="wide"
				icon="arrow"
				onClick={() => {
					setData((d) => ({
						...d,
						authenticated: true,
					}))
					setModal(null)
					go('add')
				}}
			>
				{t('demoLogin')}
			</Button>
			<small>{t('loginFoot')}</small>
		</div>
	)
}
function ChooseCategory() {
	const { data, t, name, setModal } = useApp()
	return (
		<>
			<h2 id="dialog-title">{t('selectCategory')}</h2>
			<div className="category-picker">
				{data.categories
					.filter((c) => !c.archived)
					.map((c) => (
						<button
							key={c.id}
							onClick={() =>
								setModal({
									type: 'expense',
									draft: {
										categoryId: c.id,
										date: today(),
										currency: data.currency,
									},
								})
							}
						>
							<span
								className="category-icon"
								style={{
									'--category': c.color,
								}}
							>
								<Icon name={c.icon} />
							</span>
							<span>{name(c)}</span>
							<Icon name="chevron" size={17} />
						</button>
					))}
			</div>
		</>
	)
}
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
			<p className="modal-sub">{t('confirmSub')}</p>
			<div className="amount-field">
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
				<label className="currency-select">
					<span className="sr-only">{t('currency')}</span>
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
			<div className="form-grid">
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
				className="details-toggle"
				aria-expanded={details}
				onClick={() => setDetails(!details)}
			>
				<Icon name={details ? 'close' : 'plus'} size={17} />
				{t('details')}
				<span>{t('optional')}</span>
			</button>
			{details && (
				<div className="optional-fields">
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
					<div className="field">
						<span>{t('receipt')}</span>
						{form.receipt ? (
							<div className="receipt-preview">
								<img src={form.receipt} alt={t('receipt')} />
								<button
									type="button"
									className="text-button danger-text"
									onClick={() => update('receipt', null)}
								>
									{t('removePhoto')}
								</button>
							</div>
						) : (
							<label className="photo-upload">
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
							<p className="error" role="alert">
								{errors.receipt}
							</p>
						)}
					</div>
					<div className="quiet-note">
						<Icon name="spark" size={18} />
						{t('scan')}
						<span className="tag">{t('soon')}</span>
					</div>
				</div>
			)}
			<Button type="submit" className="wide" icon="check">
				{t(existing ? 'save' : 'confirm')}
			</Button>
			{existing && (
				<button
					type="button"
					className="delete-button"
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
function DeleteForm() {
	const { modal, setModal, setData, t, desc, fmt, notify } = useApp()
	const row = modal.expense
	return (
		<>
			<span className="delete-icon">
				<Icon name="trash" size={28} />
			</span>
			<h2 id="dialog-title">{t('deleteTitle')}</h2>
			<p className="modal-sub">{t('deleteSub')}</p>
			<div className="delete-summary">
				<strong>{desc(row)}</strong>
				<span>{fmt(row.amount, row.currency)}</span>
			</div>
			<Button
				className="wide destructive"
				icon="trash"
				onClick={() => {
					setData((d) => ({
						...d,
						expenses: d.expenses.filter((e) => e.id !== row.id),
					}))
					setModal(null)
					notify(t('deleted'), () =>
						setData((d) => ({
							...d,
							expenses: d.expenses.some((e) => e.id === row.id)
								? d.expenses
								: [...d.expenses, row],
						})),
					)
				}}
			>
				{t('delete')}
			</Button>
			<Button
				className="wide"
				secondary
				onClick={() =>
					setModal({
						type: 'expense',
						expense: row,
					})
				}
			>
				{t('cancel')}
			</Button>
		</>
	)
}
function PeriodForm() {
	const { modal, setModal, t } = useApp()
	const [from, setFrom] = useState(
			modal.custom?.from || monthOf(today()) + '-01',
		),
		[to, setTo] = useState(modal.custom?.to || today()),
		[error, setError] = useState('')
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				if (!from || !to || from > to) {
					setError(t('badDates'))
					return
				}
				modal.onApply({
					from,
					to,
				})
				setModal(null)
			}}
		>
			<h2 id="dialog-title">{t('period')}</h2>
			<div className="form-grid">
				<Field label={t('from')}>
					<input
						type="date"
						required
						value={from}
						onChange={(e) => setFrom(e.target.value)}
					/>
				</Field>
				<Field label={t('to')}>
					<input
						type="date"
						required
						value={to}
						onChange={(e) => setTo(e.target.value)}
					/>
				</Field>
			</div>
			{error && (
				<p role="alert" className="error">
					{error}
				</p>
			)}
			<Button type="submit" className="wide">
				{t('apply')}
			</Button>
		</form>
	)
}
function FiltersForm() {
	const { modal, setModal, data, t, name } = useApp()
	const [f, setF] = useState(modal.filters || {}),
		[error, setError] = useState('')
	const update = (k, v) =>
		setF((s) => ({
			...s,
			[k]: v,
		}))
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				if (f.from && f.to && f.from > f.to) {
					setError(t('badDates'))
					return
				}
				if (f.min && f.max && Number(f.min) > Number(f.max)) {
					setError(t('badAmount'))
					return
				}
				modal.onApply(f)
				setModal(null)
			}}
		>
			<h2 id="dialog-title">{t('filters')}</h2>
			<Field label={t('category')}>
				<select
					value={f.categoryId || ''}
					onChange={(e) => update('categoryId', e.target.value)}
				>
					<option value="">{t('allCategories')}</option>
					{data.categories.map((c) => (
						<option key={c.id} value={c.id}>
							{name(c)}
						</option>
					))}
				</select>
			</Field>
			<div className="form-grid">
				<Field label={t('from')}>
					<input
						type="date"
						value={f.from || ''}
						onChange={(e) => update('from', e.target.value)}
					/>
				</Field>
				<Field label={t('to')}>
					<input
						type="date"
						value={f.to || ''}
						onChange={(e) => update('to', e.target.value)}
					/>
				</Field>
				<Field label={t('minAmount')}>
					<input
						type="number"
						min="0"
						step="0.01"
						value={f.min || ''}
						onChange={(e) => update('min', e.target.value)}
					/>
				</Field>
				<Field label={t('maxAmount')}>
					<input
						type="number"
						min="0"
						step="0.01"
						value={f.max || ''}
						onChange={(e) => update('max', e.target.value)}
					/>
				</Field>
			</div>
			{error && (
				<p role="alert" className="error">
					{error}
				</p>
			)}
			<Button type="submit" className="wide">
				{t('apply')}
			</Button>
			<Button
				secondary
				type="button"
				className="wide"
				onClick={() => {
					modal.onApply({})
					setModal(null)
				}}
			>
				{t('reset')}
			</Button>
		</form>
	)
}
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
			<fieldset className="picker-fieldset">
				<legend>{t('icon')}</legend>
				<div className="icon-grid">
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
							className={icon === i ? 'selected' : ''}
							aria-label={i}
							aria-pressed={icon === i}
							onClick={() => setIcon(i)}
						>
							<Icon name={i} />
						</button>
					))}
				</div>
			</fieldset>
			<fieldset className="picker-fieldset">
				<legend>{t('color')}</legend>
				<div className="color-grid">
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
							className={color === v ? 'selected' : ''}
							aria-label={v}
							aria-pressed={color === v}
							onClick={() => setColor(v)}
						>
							{color === v && <Icon name="check" size={17} />}
						</button>
					))}
				</div>
			</fieldset>
			<Button className="wide" type="submit">
				{t('save')}
			</Button>
			{c && (
				<>
					<button
						type="button"
						className="text-button archive-button"
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
					<p className="form-foot">{t('archiveHelp')}</p>
				</>
			)}
		</form>
	)
}
function BudgetForm() {
	const { modal, setModal, data, setData, t, notify } = useApp()
	const [value, setValue] = useState(modal.limit ? minorText(modal.limit) : ''),
		[error, setError] = useState('')
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				const n = parseMinor(value)
				if (!n) {
					setError(t('badAmount'))
					return
				}
				const key = modal.month + '|' + data.currency
				setData((d) => ({
					...d,
					budgets: {
						...d.budgets,
						[key]: n,
					},
				}))
				setModal(null)
				notify(t('saved'))
			}}
		>
			<h2 id="dialog-title">{t('limit')}</h2>
			<p className="modal-sub">
				{modal.month} · {data.currency}
			</p>
			<Field label={t('amount')} error={error}>
				<input
					autoFocus
					inputMode="decimal"
					value={value}
					placeholder="20 000"
					onChange={(e) => setValue(e.target.value)}
				/>
			</Field>
			<p className="form-foot">{t('budgetCurrencies')}</p>
			<Button className="wide" type="submit">
				{t('save')}
			</Button>
		</form>
	)
}
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
			<div className="form-grid">
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
			<fieldset className="picker-fieldset">
				<legend>{t('channels')}</legend>
				<div className="channel-options">
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
			<Button type="submit" className="wide" disabled={!f.channels.length}>
				{t('save')}
			</Button>
		</form>
	)
}
export default App
