import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";

interface Project {
  name: string;
  readme?: string | null;
  comments?: string;
  displayName?: string;
}

const GITHUB_USERNAME = "alexisnsns";

function App() {
  const [projects, setProjects] = useState<Project[]>([
    { name: "defiPendulum", comments: "", displayName: "DeFi Pendulum" },
    { name: "russianrouleth", comments: "", displayName: "Russian Rouleth" },
    { name: "scrapernews", comments: "", displayName: "News Scraper" },
    { name: "pepebot", comments: "", displayName: "Pepe Twitter Bot" },
    { name: "sepoliafaucet", comments: "", displayName: "Sepolia Faucet" },
    { name: "zenLoop", comments: "", displayName: "ZenLoop" },
    // https://gitlab.com/dev_lucas/cross_arb
  ]);

  const fetchReadmeText = async (
    projectName: string
  ): Promise<string | null> => {
    // default URLs to try for any repo
    const urls = [
      `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${projectName}/main/README.md`,
      `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${projectName}/main/readme.md`,
    ];

    // special case for zenLoop (since it’s on a different repo path)
    if (projectName.toLowerCase() === "zenloop") {
      urls.push(
        "https://raw.githubusercontent.com/alexberthon/zenloop/master/README.md"
      );
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
        })
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
    <div style={styles.container} className="container">
      <h1 style={styles.title}>Alex N</h1>

      <p style={styles.subtitle}>Full-stack dev · Mostly TS/JS and Web3</p>

      <hr
        style={{
          width: "60%",
          border: "none",
          borderTop: "1px solid #e2e8f0",
        }}
      />

      <p style={styles.text}>
        Currently building{" "}
        <a
          style={styles.link}
          href="https://x.com/getjoin_io"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          target="_blank"
        >
          @getJoin
        </a>
        's institutional DeFi savings platform.
      </p>
      <p style={styles.text}>
        Crafting free range, fair trade, organic software for DeFi teams.
      </p>
      <p style={styles.text}>Proud ETH node operator; going bankless.</p>
      <div style={styles.links}>
        <div
          className="link-group"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textAlign: "center",
          }}
        >
          <a
            style={{
              ...styles.link,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <FiCheck size={16} strokeWidth={2} />
                Copied!
              </>
            ) : (
              <>
                {/* 📋 Copy Icon */}
                {email}
              </>
            )}
          </a>
          ·
          <a
            href={`https://gitlab.com/${GITHUB_USERNAME}`}
            target="_blank"
            style={styles.link}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            GitLab
          </a>
          ·
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            style={styles.link}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            GitHub
          </a>
          ·
          <a
            href="/resumeAlexN.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            Resume
          </a>
        </div>
      </div>
      <hr
        style={{
          width: "60%",
          border: "none",
          borderTop: "1px solid #e2e8f0",
          marginTop: "1rem",
        }}
      />
      <h2>Day Work </h2>
      <p style={{ ...styles.text, marginBottom: 5 }}>
        Selected professional experience:
      </p>
      <ul style={{ ...styles.text, textAlign: "left", lineHeight: 1.5 }}>
        <li>
          <a href="https://getjoin.io/join-pro" style={styles.link}>
            Join Pro
          </a>
          : Institutional DeFi savings & treasury platform
        </li>
        <li>
          <a
            href="https://apps.apple.com/us/app/join-wallet/id6590635145"
            style={styles.link}
          >
            Join Wallet
          </a>
          : Self-custodial MPC crypto wallet (iOS/Android)
        </li>
        <li>
          <a href="https://www.apeworx.io/" style={styles.link}>
            ApeWorx
          </a>
          : Open-source smart contract dev toolkit
        </li>
      </ul>

      <h2 style={{ marginTop: "" }}>Night Work</h2>
      <div style={styles.projectGrid} className="project-grid">
        {projects.map((p) => (
          <div key={p.name} style={styles.projectCard} className="project-card">
            <h3>
              {" "}
              <a
                href={`https://github.com/${GITHUB_USERNAME}/${p.name}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.repoLink}
              >
                <FaGithub size={16} strokeWidth={2} />
              </a>
              {p.displayName}
            </h3>
            <pre style={styles.readme}>
              {p.readme ? p.readme.slice(0, 600) + "..." : "No Readme found."}
            </pre>
            <p> {p.comments}</p>
          </div>
        ))}
      </div>
      <footer style={styles.footer}>
        <p>
          Feel free to re-use this basic Vite/TSX template for your own needs
          <a
            href={`https://github.com/${GITHUB_USERNAME}/pfalexns`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.repoLink}
          >
            <FaGithub size={16} strokeWidth={2} style={{ marginLeft: 4 }} />
          </a>
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "system-ui, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#ffffff",
    color: "#000000",
    padding: "2rem",
  },
  title: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  subtitle: { fontSize: "1.2rem", opacity: 0.8, textAlign: "center" },
  text: { maxWidth: 600, textAlign: "center" },
  links: { display: "flex", gap: "1rem", marginTop: "1rem" },
  link: {
    color: "#6b7280",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color 0.2s",
    cursor: "pointer",
  },
  projectCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  readme: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    padding: "8px",
  },
  repoLink: {
    display: "inline-flex",
    alignItems: "center",
    color: "black",
    textDecoration: "none",
    fontWeight: 500,
    marginRight: 5,
  },

  footer: {
    marginTop: "4rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #e2e8f0",
    fontSize: "0.9rem",
    opacity: 0.7,
    textAlign: "center",
  },
  projectGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "1.5rem",
    marginTop: "2rem",
    maxWidth: "900px",
    width: "100%",
  },
};

export default App;
