"use client";

import Link from "next/link";

import { useLanguage } from "@/components/LanguageProvider";
import SiteNav from "@/components/SiteNav";
import Countdown from "@/components/Countdown";
import Gallery from "@/components/Gallery";

export default function HomeContent() {
  const { t } = useLanguage();

  return (
    <main>
      <SiteNav />

      {/* HERO */}
      <section className="hero">
        <div className="shell" style={{ width: "100%" }}>
          <div className="heroContent">
            <div className="eyebrow">{t.heroEyebrow}</div>

            <h1 className="serif">
              Olivier
              <br />

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "0.16em",
                }}
              >
                <i>&</i>
                Priscilla
              </span>
            </h1>

            <p>{t.heroText}</p>

            <div className="actions">
              <Link className="btn btnDark" href="/rsvp">
                {t.confirm}
              </Link>

              <a className="btn" href="#journee">
                {t.discover}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* COUNTDOWN */}
      <section className="section white">
        <div className="shell" style={{ textAlign: "center" }}>
          <div className="eyebrow">{t.countdown}</div>

          <h2 className="serif title">{t.countdownTitle}</h2>

          <Countdown />
        </div>
      </section>

      {/* NOTRE HISTOIRE */}
      <section id="histoire" className="section">
        <div className="shell grid2">
          <div>
            <div className="eyebrow">{t.ourStory}</div>

            <h2 className="serif title">{t.storyTitle}</h2>

            <p
              className="muted"
              style={{
                fontSize: 17,
                lineHeight: 1.8,
                maxWidth: 560,
              }}
            >
              {t.storyText1}
            </p>

            <p
              className="muted"
              style={{
                fontSize: 17,
                lineHeight: 1.8,
                maxWidth: 560,
              }}
            >
              {t.storyText2}
            </p>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                gap: 35,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div className="eyebrow">{t.storyBeginning}</div>
                <div
                  className="serif"
                  style={{
                    fontSize: 28,
                    marginTop: 5,
                  }}
                >
                  {t.storyBeginningText}
                </div>
              </div>

              <div>
                <div className="eyebrow">{t.storyFamily}</div>
                <div
                  className="serif"
                  style={{
                    fontSize: 28,
                    marginTop: 5,
                  }}
                >
                  {t.storyFamilyText}
                </div>
              </div>

              <div>
                <div className="eyebrow">{t.storyNext}</div>
                <div
                  className="serif"
                  style={{
                    fontSize: 28,
                    marginTop: 5,
                  }}
                >
                  {t.storyNextText}
                </div>
              </div>
            </div>
          </div>

          <div
            className="storyPhoto"
            role="img"
            aria-label="Olivier et Priscilla"
          />
        </div>
      </section>

      {/* NOTRE JOURNÉE */}
      <section id="journee" className="section white">
        <div className="shell grid2">
          <div
            className="photoHero"
            role="img"
            aria-label="Priscilla et Olivier"
          />

          <div>
            <div className="eyebrow">{t.ourDay}</div>

            <h2 className="serif title">{t.chapter}</h2>

            <p className="muted">{t.dayText}</p>

            <div className="timeline">
              <div>
                <strong>15 h 00</strong>
                <div className="muted">{t.ceremony}</div>
              </div>

              <div>
                <strong>16 h 00</strong>
                <div className="muted">{t.cocktail}</div>
              </div>

              <div>
                <strong>18 h 00</strong>
                <div className="muted">{t.dinner}</div>
              </div>

              <div>
                <strong>21 h 00</strong>
                <div className="muted">{t.dancing}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HÉBERGEMENT */}
      <section id="hotel" className="section sage">
        <div className="shell grid2">
          <div>
            <div className="eyebrow">{t.accommodation}</div>

            <h2 className="serif title">{t.sleep}</h2>

            <p className="muted">{t.hotelText}</p>

            <a
              className="btn btnDark"
              href="https://www.esterel.com/"
              target="_blank"
              rel="noreferrer"
            >
              {t.seeHotel}
            </a>
          </div>

          <div className="card">
            <h3
              className="serif"
              style={{
                fontSize: 38,
                marginTop: 0,
              }}
            >
              {t.weekend}
            </h3>

            <p className="muted">{t.weekendText}</p>
          </div>
        </div>
      </section>

      {/* PHOTOS */}
      <section id="photos" className="section white">
        <div className="shell">
          <div className="eyebrow">{t.memories}</div>

          <h2 className="serif title">{t.guestPhotos}</h2>

          <Gallery />

          <div style={{ marginTop: 25 }}>
            <Link className="btn" href="/photos">
              {t.addPhoto}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div
          className="serif"
          style={{
            fontSize: 28,
            color: "var(--espresso)",
          }}
        >
          O & P
        </div>

        <p>{t.heroEyebrow}</p>

        <Link href="/admin">Administration</Link>
      </footer>
    </main>
  );
}