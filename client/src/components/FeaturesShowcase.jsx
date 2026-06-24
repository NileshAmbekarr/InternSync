import { useRef, useState } from 'react';
import {
    motion as Motion,
    useScroll,
    useTransform,
    useMotionValueEvent,
    useReducedMotion,
} from 'framer-motion';
import {
    UploadCloud,
    MessageSquare,
    Star,
    BarChart3,
    Bell,
    ShieldCheck,
} from 'lucide-react';
import './FeaturesShowcase.css';

const features = [
    { icon: UploadCloud, title: 'Effortless submissions', text: 'Interns post daily logs or weekly reports with file attachments in seconds — no friction, no lost work.' },
    { icon: MessageSquare, title: 'Threaded feedback', text: 'Discuss any report inline. A real, focused conversation between intern and reviewer, kept with the work.' },
    { icon: Star, title: 'Ratings & grading', text: 'Score submissions with stars, marks out of 100, and written feedback — all from one review workspace.' },
    { icon: BarChart3, title: 'Live analytics', text: 'Track submission trends, status breakdowns, and your top performers with a real-time analytics dashboard.' },
    { icon: Bell, title: 'Smart notifications', text: 'In-app and email alerts keep everyone in sync, with an optional daily digest of everything that matters.' },
    { icon: ShieldCheck, title: 'Roles & isolation', text: 'Owner, admin, and intern roles with strict per-organization data isolation built into every query.' },
];

const total = features.length;

const ShowcaseCard = ({ feature, index, progress, zIndex }) => {
    const Icon = feature.icon;
    const c = index / (total - 1);
    const half = 0.5 / (total - 1);

    const opacity = useTransform(progress, [c - half, c, c + half], [0, 1, 0]);
    const y = useTransform(progress, [c - half, c, c + half], [70, 0, -70]);
    const scale = useTransform(progress, [c - half, c, c + half], [0.9, 1, 0.9]);

    return (
        <Motion.article className="fs-card" style={{ opacity, y, scale, zIndex }}>
            <span className="fs-card-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="fs-icon"><Icon size={30} /></span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
        </Motion.article>
    );
};

const FeaturesShowcase = () => {
    const sectionRef = useRef(null);
    const reduceMotion = useReducedMotion();
    const [active, setActive] = useState(0);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end end'],
    });

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        const idx = Math.min(total - 1, Math.max(0, Math.round(v * (total - 1))));
        setActive(idx);
    });

    // Static, accessible fallback when the user prefers reduced motion
    if (reduceMotion) {
        return (
            <section className="section fs-fallback" id="features">
                <div className="container">
                    <div className="section-head">
                        <h2 className="section-title display">Everything you need to run great internships</h2>
                        <p className="section-lead">From the first submission to the final grade — covered.</p>
                    </div>
                    <div className="fs-fallback-grid">
                        {features.map(({ icon: Icon, title, text }, i) => (
                            <article className="fs-card static" key={title}>
                                <span className="fs-card-index">{String(i + 1).padStart(2, '0')}</span>
                                <span className="fs-icon"><Icon size={30} /></span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            className="fs-section"
            id="features"
            ref={sectionRef}
            style={{ height: `${total * 78}vh` }}
        >
            <div className="fs-sticky">
                <div className="container fs-inner">
                    {/* pinned heading */}
                    <div className="fs-head">
                        <span className="fs-counter display">
                            {String(active + 1).padStart(2, '0')}
                            <span className="fs-counter-total"> / {String(total).padStart(2, '0')}</span>
                        </span>
                        <h2 className="section-title display">
                            Everything you need to run great internships
                        </h2>
                        <p className="section-lead">Scroll to explore — one capability at a time.</p>

                        <ul className="fs-legend">
                            {features.map((f, i) => (
                                <li key={f.title} className={i === active ? 'active' : ''}>
                                    <span className="fs-legend-bar" />
                                    {f.title}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* stacked card stage */}
                    <div className="fs-stage">
                        {features.map((feature, i) => (
                            <ShowcaseCard
                                key={feature.title}
                                feature={feature}
                                index={i}
                                progress={scrollYProgress}
                                zIndex={total - Math.abs(i - active)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesShowcase;
