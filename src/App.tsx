import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import ReactMarkdown, { type Components } from "react-markdown";
import GoogleAnalytics from "./googleAnalytics";
import "./App.css";

// README h1 repeats the card title; other headings shrink to card size; images skipped.
const README_COMPONENTS: Components = {
  h1: () => null,
  h2: "h4",
  h3: "h4",
  h4: "h4",
  h5: "h4",
  h6: "h4",
  img: () => null,
};

interface Project {
  name: string;
  readme?: string | null;
  comments?: string;
  displayName?: string;
  link?: string;
}

const GITHUB_USERNAME = "alexisnsns";

interface ExperienceEntry {
  role: string;
  company: string;
  link?: string;
  note: string;
  dates: string;
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "Senior Front-End Developer",
    company: "T-RIZE",
    link: "https://www.t-rize.io/",
    note: "Real-world asset tokenization platform, Montréal",
    dates: "Nov 2025 – now",
  },
  {
    role: "Mobile & Full-Stack Developer",
    company: "JOIN",
    link: "https://getjoin.io/join-pro",
    note: "Digital asset investment products, Montréal",
    dates: "Dec 2023 – Nov 2025",
  },
  {
    role: "Operations Manager",
    company: "Flatsy",
    note: "Proptech marketplace for property viewings, Paris",
    dates: "Sep 2020 – Apr 2023",
  },
  {
    role: "Global Expansion Lead",
    company: "Plum Guide",
    note: "Short-term rental marketplace, London",
    dates: "Mar 2020 – Sep 2020",
  },
  {
    role: "Marketplace Coordinator",
    company: "Plum Guide",
    note: "Paris",
    dates: "Feb 2019 – Mar 2020",
  },
  {
    role: "Venture Capital Analyst",
    company: "LA Angels Society",
    note: "Early-stage VC, São Paulo",
    dates: "2017",
  },
];

function App() {
  const [projects, setProjects] = useState<Project[]>([
    {
      name: "ondo-analytics",
      comments: "",
      displayName: "Ondo RWA",
      link: "https://ondofinance.dev/",
    },
    {
      name: "sepoliafaucet",
      comments: "",
      displayName: "Sepolia Faucet",
      link: "https://sepoliafaucet.vercel.app/",
    },
    {
      name: "defiPendulum",
      comments: "",
      displayName: "DeFi Pendulum",
      link: "https://x.com/defiautopilot",
    },
    {
      name: "DCAbot",
      comments: "",
      displayName: "DeFi DCA Automation",
    },
    {
      name: "russianrouleth",
      comments: "",
      displayName: "Russian Rouleth",
      link: "https://www.russianrouleth.lol/",
    },
    { name: "scrapernews", comments: "", displayName: "News Scraper" },
    {
      name: "pepebot",
      comments: "",
      displayName: "Pepe Twitter Bot",
      link: "https://x.com/pepeappreciator",
    },
    { name: "zenLoop", comments: "", displayName: "ZenLoop" },
    // https://gitlab.com/dev_lucas/cross_arb
  ]);

  const fetchReadmeText = async (
    projectName: string,
  ): Promise<string | null> => {
    // special case for zenLoop (since it's on a different repo path)
    let urls: string[];
    if (projectName.toLowerCase() === "zenloop") {
      urls = [
        "https://raw.githubusercontent.com/alexberthon/zenloop/master/README.md",
        "https://raw.githubusercontent.com/alexberthon/zenloop/master/readme.md",
      ];
    } else {
      // default URLs to try for any repo
      urls = [
        `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${projectName}/main/README.md`,
        `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${projectName}/main/readme.md`,
      ];
    }

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.text();
      } catch {
        // just continue to the next URL
      }
    }

    return null;
  };

  useEffect(() => {
    const fetchAllReadmes = async () => {
      const updated = await Promise.all(
        projects.map(async (p) => {
          const readme = await fetchReadmeText(p.name);
          return { ...p, readme };
        }),
      );
      setProjects(updated);
    };

    fetchAllReadmes();
  }, []);

  const [copied, setCopied] = useState(false);
  const email = "hello@alexn.me";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // reset after 1.5s
  };

  return (
    <>
      <GoogleAnalytics trackingId="G-78JRS5F43L" />
      <main className="home">
        <header className="masthead">
          <h1 className="masthead-name">Alexis NS</h1>
          <nav className="masthead-links" aria-label="Contact and links">
            <button
              type="button"
              title="Copy email address"
              onClick={handleCopy}
            >
              {copied ? "Copied" : email}
            </button>
            <Link to="/Ideas">Ideas</Link>
            <a
              href={`https://gitlab.com/${GITHUB_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitLab
            </a>
            <a
              href={`https://github.com/${GITHUB_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a href="./resumeAlexN.pdf" target="_blank" rel="noopener noreferrer">
              Resume
            </a>
          </nav>
        </header>

        <div className="home-intro">
          <p className="home-lead">
            Seven years in startups, on <mark>both sides</mark> of the product.
          </p>
          <p className="home-role">
            Senior Front-End Developer at T-RIZE, Montréal
          </p>
        </div>

        <div className="home-prose">
          <p>
            I did a master's in economics and finance at Sciences Po, and in
            2017 I worked in São Paulo as an analyst at LA Angels Society, an
            early-stage VC fund, looking at startups from the outside.
          </p>
          <p>
            In 2019 I went inside one. I joined Plum Guide in Paris to grow the
            supply side of the marketplace, and owned acquisition for Paris, its
            second-largest market. A year later I was promoted and moved to
            London to lead acquisition and supply onboarding for the UK and the
            US.
          </p>
          <p>
            I then spent close to three years at Flatsy, back in Paris, running
            operations for a field team of 100+ people across the region, with
            four direct reports.
          </p>
          <p>
            After that I retrained as a developer. At JOIN in Montréal I
            launched the mobile app on iOS and Android, which reached $10M+ in
            traded volume, and built the onboarding and KYC, the deposit and
            withdrawal flows for institutional clients, and the dashboards the
            team used to track usage.
          </p>
          <p>
            Now I'm at T-RIZE, where I build the front end and also work on the
            roadmap, UX and sprint planning. That's where the operations years
            come in handy.
          </p>
          <p>
            Along the way I've worked in France, the UK, the US, Brazil and
            Canada, and I speak French, English, Spanish and Portuguese. Outside
            work I run ultra-trails: QMT 80K and NOTOS 65K this year, and my
            first 100K season in 2027. I also won Paris Startup Weekend in 2019.
          </p>
          <p>
            I write about what I'm thinking through on the{" "}
            <Link to="/Ideas">Ideas page</Link>.
          </p>
        </div>

        <section className="home-section" aria-labelledby="experience">
          <h2 id="experience">Experience</h2>
          <ul className="home-timeline">
            {EXPERIENCE.map((e) => (
              <li key={e.role + e.company}>
                <span>
                  <span className="home-role-title">{e.role}</span>,{" "}
                  {e.link ? (
                    <a href={e.link} target="_blank" rel="noopener noreferrer">
                      {e.company}
                    </a>
                  ) : (
                    e.company
                  )}
                </span>
                <span className="home-dates">{e.dates}</span>
                <span className="home-note">{e.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section" aria-labelledby="open-source">
          <h2 id="open-source">Open source</h2>
          <div className="home-grid">
            {projects.map((p) => (
              <article key={p.name} className="home-card">
                <h3>
                  {p.displayName}
                  <a
                    href={
                      p.name.toLowerCase() === "zenloop"
                        ? "https://github.com/alexberthon/zenloop"
                        : `https://github.com/${GITHUB_USERNAME}/${p.name}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.displayName} source on GitHub`}
                  >
                    <FaGithub size={15} />
                  </a>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer">
                      Live
                      <FiArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  )}
                </h3>
                <div className="home-readme">
                  {p.readme ? (
                    <ReactMarkdown components={README_COMPONENTS}>
                      {p.readme.slice(0, 600)}
                    </ReactMarkdown>
                  ) : (
                    "No README found."
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="home-footer">
          <p>Feel free to re-use this Vite/TSX template for your own needs.</p>
          <a
            href={`https://github.com/${GITHUB_USERNAME}/pfalexns`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source of this site on GitHub"
          >
            <FaGithub size={16} />
          </a>
        </footer>
      </main>
    </>
  );
}

export default App;
