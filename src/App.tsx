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
  previous?: { role: string; note: string; dates: string };
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    role: "Senior Front-End Developer",
    company: "t-rize.io",
    link: "https://www.t-rize.io/",
    note: "Real-world asset tokenization platform, Montréal",
    dates: "Nov 2025 – now",
  },
  {
    role: "Mobile & Full-Stack Developer",
    company: "JOIN",
    link: "https://x.com/getjoin_io",
    note: "Digital asset investment products, CT, USA then Montréal",
    dates: "Apr 2023 – Nov 2025",
  },
  {
    role: "Operations Manager",
    company: "flatsy.fr",
    link: "https://www.flatsy.fr/",
    note: "Proptech marketplace for property viewings, Paris",
    dates: "Sep 2020 – Apr 2023",
  },
  {
    role: "Global Expansion Lead",
    company: "plumguide.com",
    link: "https://www.plumguide.com/",
    note: "Short-term rental marketplace, London",
    dates: "Mar 2020 – Sep 2020",
    previous: {
      role: "Marketplace Coordinator",
      note: "Paris",
      dates: "Feb 2019 – Mar 2020",
    },
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
            7+ years in startups, across <mark>operations and product engineering</mark>
          </p>
          <p className="home-role">
            Senior Front-End Developer at T-RIZE, Montréal
          </p>
        </div>

        <div className="home-prose">
          <p>
            I started in operations at marketplace startups. At{" "}
            <a href="https://www.plumguide.com/" target="_blank" rel="noopener noreferrer">
              plumguide.com
            </a>
            , a holiday-rental marketplace, I ran acquisition for the Paris
            market, then moved to London in 2020 to work on the UK and US
            markets. At{" "}
            <a href="https://www.flatsy.fr/" target="_blank" rel="noopener noreferrer">
              flatsy.fr
            </a>{" "}
            I ran a field
            team of more than a hundred people across Paris, with four people
            helping me run the day to day.
          </p>
          <p>
            I'd been building things on the side for a while, and in 2023 I made the switch to engineering full time. At{" "}
            <a href="https://x.com/getjoin_io" target="_blank" rel="noopener noreferrer">
              JOIN
            </a>{" "}
            I helped build and launch
            a mobile app for managing digital assets, then the deposit and
            withdrawal flows for its institutional clients. Now I'm at{" "}
            <a href="https://www.t-rize.io/" target="_blank" rel="noopener noreferrer">
              t-rize.io
            </a>
            , where I write the front end and have started taking on product work:
            the roadmap, specs and sprint planning.
          </p>
          <p>
            I studied Economics and Finance at Sciences Po, with a stint as an
            analyst at an early-stage VC fund in São Paulo. I speak French,
            English, Spanish and Portuguese, and I've worked in France, the UK,
            the US, Brazil and Canada.
          </p>
          <p>
            Outside work, I love running, mostly trail, and lately longer and
            longer: I've started dabbling in ultra-distances.
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
                {e.previous && (
                  <div className="home-previous">
                    <span className="home-previous-label">
                      Previously at {e.company}
                    </span>
                    <span className="home-role-title">{e.previous.role}</span>
                    <span className="home-dates">{e.previous.dates}</span>
                    <span className="home-note">{e.previous.note}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section" aria-labelledby="open-source">
          <h2 id="open-source">Open source</h2>
          <div className="home-grid">
            {projects.map((p) => (
              <article key={p.name} className="home-card">
                <h3>{p.displayName}</h3>
                <div className="home-readme">
                  {p.readme ? (
                    <ReactMarkdown components={README_COMPONENTS}>
                      {p.readme.slice(0, 600)}
                    </ReactMarkdown>
                  ) : (
                    "No README found."
                  )}
                </div>
                <div className="home-card-links">
                  <a
                    href={
                      p.name.toLowerCase() === "zenloop"
                        ? "https://github.com/alexberthon/zenloop"
                        : `https://github.com/${GITHUB_USERNAME}/${p.name}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.displayName} source code`}
                  >
                    Source
                    <FiArrowUpRight size={13} aria-hidden="true" />
                  </a>
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${p.displayName} live site`}
                    >
                      Live site
                      <FiArrowUpRight size={13} aria-hidden="true" />
                    </a>
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
