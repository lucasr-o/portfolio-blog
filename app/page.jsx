import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/components/JsonLd";
import PostPreview from "@/components/PostPreview";
import SecurityTerminal from "@/components/SecurityTerminal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { latestPost } from "@/data/posts";
import { credentials, education, experience, profile, site, terminalSteps } from "@/data/profile";
import { createPersonSchema } from "@/lib/structured-data";
import styles from "./home.module.css";

export const metadata = {
  title: "Lucas Reis — Application Security Engineer",
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lucas Reis — Application Security Engineer",
    description: site.description,
    url: "/",
    type: "profile",
    siteName: "lucas-reis",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={createPersonSchema()} />
      <SiteHeader />
      <main id="main-content">
        <section className={`container ${styles.hero} reveal-on-load`} aria-labelledby="hero-title">
          <div className={styles.heroInner}>
            <p className="eyebrow">Application Security Engineer</p>
            <p className={styles.identity}>{profile.name} · {profile.location}</p>
            <h1 id="hero-title">Security that moves with the product.</h1>
            <p className={styles.lead}>{profile.summary}</p>
            <div className={styles.actions}>
              <Link className={`${styles.buttonPrimary} touch-feedback`} href="#work">View my work</Link>
              <Link className={`${styles.buttonSecondary} touch-feedback`} href="/blog">Read the blog</Link>
            </div>
          </div>
        </section>

        <div className={`container ${styles.terminalWrap} reveal-on-scroll`}><SecurityTerminal steps={terminalSteps} /></div>

        <section className={`container ${styles.section}`} id="work" tabIndex="-1" aria-labelledby="work-title">
          <div className={`${styles.sectionHeader} reveal-on-scroll`}>
            <p className="eyebrow">Selected work</p>
            <div><h2 id="work-title">From findings to decisions.</h2><p>Experience across product security, offensive testing, security operations, applied cryptography, and community leadership.</p></div>
          </div>
          <ol className={styles.experienceList}>
            {experience.map((item) => (
              <li className={`${styles.experienceItem} reveal-on-scroll`} key={`${item.organization}-${item.role}`}>
                <div className={styles.experienceMeta}>
                  <div className={styles.organizationLogoFrame}>
                    <Image className={styles.organizationLogo} src={item.logo.src} alt="" width={160} height={80} sizes="160px" />
                  </div>
                  <p>{item.period}</p><p>{item.location}</p>
                </div>
                <article className={styles.experienceBody}>
                  <h3>{item.role}</h3><p>{item.organization}</p>
                  <ul>{item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className={`container ${styles.latest}`} aria-labelledby="latest-title">
          <div className={`${styles.sectionHeader} reveal-on-scroll`}><p className="eyebrow">Latest writing</p><h2 id="latest-title">Notes from the work.</h2></div>
          <div className="reveal-on-scroll"><PostPreview post={latestPost} featured headingLevel={3} /></div>
        </section>

        <section className={`container ${styles.section}`} id="about" tabIndex="-1" aria-labelledby="about-title">
          <div className={`${styles.sectionHeader} reveal-on-scroll`}><p className="eyebrow">About</p><h2 id="about-title">Practical security, shared clearly.</h2></div>
          <div className={`${styles.aboutGrid} reveal-on-scroll`}>
            <div className={styles.aboutNarrative}><p className={styles.aboutCopy}>{profile.summary}</p><p className={styles.objective}>{profile.objective}</p></div>
            <figure className={styles.portrait}>
              {profile.photo ? <div className={styles.portraitMedia}><Image className={styles.portraitImage} src={profile.photo} alt={`Portrait of ${profile.shortName}`} fill sizes="(max-width: 736px) 100vw, 38vw" /></div> : <div className={styles.portraitPlaceholder} role="img" aria-label="Portrait placeholder for Lucas Reis"><span>LR</span></div>}
              <figcaption><strong>Lucas Reis</strong><span>Application Security Engineer</span></figcaption>
            </figure>
          </div>
        </section>

        <section className={`container ${styles.section}`} aria-labelledby="education-title">
          <div className={`${styles.sectionHeader} reveal-on-scroll`}><p className="eyebrow">Academic background</p><h2 id="education-title">Foundations for the next problem.</h2></div>
          <ul className={styles.simpleList}>
            {education.map((item) => (
              <li className="reveal-on-scroll" key={item.credential}>
                <div className={styles.educationIdentity}>
                  <div className={styles.institutionLogoFrame}>
                    <Image className={styles.institutionLogo} src={item.logo.src} alt="" width={112} height={64} sizes="112px" />
                  </div>
                  <div><strong>{item.credential}</strong><p>{item.institution}</p></div>
                </div>
                <span>{item.period}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`container ${styles.section}`} aria-labelledby="credentials-title">
          <div className={`${styles.sectionHeader} reveal-on-scroll`}><p className="eyebrow">Credentials</p><h2 id="credentials-title">Learning that compounds.</h2></div>
          <ul className={styles.credentialList}>
            {credentials.map((item) => (
              <li className="reveal-on-scroll" key={`${item.issuer}-${item.name}`}><p>{item.issuer}</p><div><strong>{item.name}</strong>{item.details ? <p>{item.details}</p> : null}</div><span>{item.date}</span></li>
            ))}
          </ul>
        </section>

        <section className={`container ${styles.section} ${styles.contact}`} id="contact" tabIndex="-1" aria-labelledby="contact-title">
          <div className="reveal-on-scroll">
            <p className="eyebrow">Contact</p><h2 id="contact-title">Let’s make the next release safer.</h2><p className={styles.contactLocation}>{profile.location}</p>
            <div className={styles.contactLinks}>
              <a className="touch-feedback" href={profile.contact.emailHref}>{profile.contact.email}</a>
              <a className="touch-feedback" href={profile.contact.linkedIn} rel="me">LinkedIn</a>
              <a className="touch-feedback" href={profile.contact.github} rel="me">GitHub</a>
              <a className="touch-feedback" href={profile.contact.x} rel="me">X</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
