import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import Brand from '../Brand/brand';
import Button from '../Button/button';
import Appearance from '../Appearance/appearance';
import HeroBars from '../HeroBars/heroBars';
import HeroPhone from '../HeroPhone/heroPhone';
import { bindStyles } from '../../styles/bindStyles';
import styles from './landing.module.css';

function Landing() {
	const { t, start } = useApp()
	return (
		<div className={bindStyles(styles, "landing")}>
			<header className={bindStyles(styles, "landing-header")}>
				<button
					className={bindStyles(styles, "brand-link")}
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
				<div className={bindStyles(styles, "header-actions")}>
					<Appearance />
					<Button secondary onClick={start}>
						{t('login')}
					</Button>
				</div>
			</header>
			<main id="main-content" tabIndex={-1}>
				<section className={bindStyles(styles, "hero")}>
					<div className={bindStyles(styles, "hero-copy")}>
						<p className={bindStyles(styles, "eyebrow")}>
							<span className={bindStyles(styles, "blue-dot")} />
							{t('heroLabel')}
						</p>
						<h1>
							{t('heroA')}
							<br />
							<span>{t('heroB')}</span>
						</h1>
						<p className={bindStyles(styles, "hero-sub")}>{t('heroSub')}</p>
						<Button onClick={start} icon="arrow">
							{t('login')}
						</Button>
						<p className={bindStyles(styles, "hero-fine")}>
							<Icon name="check" size={15} />
							{t('heroFine')}
						</p>
					</div>
					<div className={bindStyles(styles, "hero-visual")}>
						<div className={bindStyles(styles, "orbit orbit-one")} />
						<div className={bindStyles(styles, "orbit orbit-two")} />
						<HeroPhone />
						<div className={bindStyles(styles, "floating-note")}>
							<span className={bindStyles(styles, "note-icon")}>
								<Icon name="check" />
							</span>
							<span>
								<strong>{t('added')}</strong>
								<small>{t('miniHint')}</small>
							</span>
						</div>
						<div className={bindStyles(styles, "tiny-note")}>
							<span className={bindStyles(styles, "blue-dot")} />
							Telegram + web
						</div>
					</div>
				</section>
				<section id="how" className={bindStyles(styles, "landing-section steps-section")}>
					<p className={bindStyles(styles, "eyebrow")}>{t('how')}</p>
					<h2>
						{t('stepTitle')} <span>{t('stepSub')}</span>
					</h2>
					<div className={bindStyles(styles, "steps")}>
						{[1, 2, 3].map((n) => (
							<div key={n} className={bindStyles(styles, "step")}>
								<span className={bindStyles(styles, "step-number")}>0{n}</span>
								<h3>{t('step' + n)}</h3>
								<p>{t('step' + n + 'body')}</p>
							</div>
						))}
					</div>
				</section>
				<section id="features" className={bindStyles(styles, "landing-section feature-section")}>
					<div className={bindStyles(styles, "feature-visual")}>
						<div className={bindStyles(styles, "feature-chart panel glass")}>
							<div className={bindStyles(styles, "section-head")}>
								<h3>{t('whereMoney')}</h3>
								<span className={bindStyles(styles, "tag")}>UAH</span>
							</div>
							<HeroBars />
							<div className={bindStyles(styles, "feature-foot")}>
								<Icon name="chart" />
								<span>{t('monthLabel')}</span>
							</div>
						</div>
						<div className={bindStyles(styles, "feature-budget panel")}>
							<div>
								<Icon name="wallet" />
								<span>{t('budget')}</span>
							</div>
							<strong>
								62<span>%</span>
							</strong>
							<div className={bindStyles(styles, "progress")}>
								<i
									style={{
										width: '62%',
									}}
								/>
							</div>
						</div>
					</div>
					<div>
						<p className={bindStyles(styles, "eyebrow")}>{t('features')}</p>
						<h2>
							{t('featureTitle')}
							<br />
							<span>{t('featureTitle2')}</span>
						</h2>
						<p className={bindStyles(styles, "section-sub")}>{t('featureSub')}</p>
						<div className={bindStyles(styles, "feature-list")}>
							{['list', 'chart', 'wallet'].map((icon, i) => (
								<div key={icon}>
									<span className={bindStyles(styles, "feature-icon")}>
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
				<section id="pricing" className={bindStyles(styles, "landing-section pricing-section")}>
					<p className={bindStyles(styles, "eyebrow")}>{t('pricing')}</p>
					<h2>{t('pricingTitle')}</h2>
					<p className={bindStyles(styles, "section-sub")}>{t('pricingSub')}</p>
					<div className={bindStyles(styles, "pricing-grid")}>
						<article className={bindStyles(styles, "price-card")}>
							<Icon name="coffee" size={28} />
							<h3>{t('free')}</h3>
							<p>{t('freeBody')}</p>
							<Button onClick={start}>{t('login')}</Button>
						</article>
						<article className={bindStyles(styles, "price-card muted-price")}>
							<span className={bindStyles(styles, "tag")}>{t('soon')}</span>
							<Icon name="spark" size={28} />
							<h3>{t('paidPlan')}</h3>
							<p>{t('paidBody')}</p>
							<Button secondary disabled>
								{t('soon')}
							</Button>
						</article>
					</div>
					<p className={bindStyles(styles, "pricing-note")}>{t('tierNote')}</p>
				</section>
				<section className={bindStyles(styles, "landing-section faq-section")}>
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
				<section className={bindStyles(styles, "landing-section final-cta")}>
					<span className={bindStyles(styles, "final-icon")}>
						<Icon name="coffee" size={30} />
					</span>
					<h2>{t('finalTitle')}</h2>
					<p>{t('finalSub')}</p>
					<Button icon="arrow" onClick={start}>
						{t('login')}
					</Button>
				</section>
			</main>
			<footer className={bindStyles(styles, "landing-footer")}>
				<Brand />
				<span>{t('footer')}</span>
				<span>© {new Date().getFullYear()} Mivo</span>
			</footer>
		</div>
	)
}

export default Landing;
