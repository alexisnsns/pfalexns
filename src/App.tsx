import { useEffect, useState } from "react";

interface Project {
  name: string;
  readme?: string;
}

const GITHUB_USERNAME = "alexisnsns"; 

function App() {
  const [projects, setProjects] = useState<Project[]>([
    { name: "defiPendulum" },
    { name: "scrapernews" },
    { name: "russianrouleth" },
    { name: "pepebot" },
    { name: "sepoliafaucet" },
    { name: "zenLoop" },
    // https://github.com/alexberthon/zenloop
  ]);


  const fetchReadmeText = async (projectName: string): Promise<string> => {
    const urls = [
      `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${projectName}/main/README.md`,
      `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${projectName}/main/readme.md`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.text();
      } catch {
        // ignore and try the next one
      }
    }

    return "No README found.";
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Alex N</h1>
      <p style={styles.subtitle}>Full-stack dev · Mostly JS/TS and Web3</p>

      <p style={styles.text}>
        I'm currently working as a full-stack developer for a Web3 company, and
        I'm generally curious about all things crypto. Going bankless. Proud ETH
        node operator.
      </p>

      <div style={styles.links}>
        <a
          href={`https://gitlab.com/${GITHUB_USERNAME}`}
          target="_blank"
          style={styles.link}
        >
          GitLab
        </a>
        /
        <a
          href={`https://github.com/${GITHUB_USERNAME}`}
          target="_blank"
          style={styles.link}
        >
          GitHub
        </a>
        <a href="mailto:hello@alexn.me" style={styles.link}>
          hello@alexn.me
        </a>
        <a
          href="/resumeAlexN.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          📄 View Resume
        </a>
      </div>

      <p style={styles.text}>
        Some projects I've worked on: - Join Wallet (link) - Join B2B (link) -
        ApeWorx
      </p>

      <h2 style={{ marginTop: "3rem" }}>Projects</h2>
      <div style={styles.projectList}>
        {projects.map((p) => (
          <div key={p.name} style={styles.projectCard}>
            <h3>{p.name}</h3>
            <pre style={styles.readme}>
              {p.readme ? p.readme.slice(0, 500) + "..." : "Loading..."}
            </pre>
            <a
              href={`https://github.com/${GITHUB_USERNAME}/${p.name}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.repoLink}
            >
              {/* GitHub Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                width="18"
                height="18"
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              >
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.69-.49-2.86-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82a7.6 7.6 0 012 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.001 8.001 0 008 0z" />
              </svg>
            </a>
          </div>
        ))}
      </div>
      <footer style={styles.footer}>
        <p>
          Feel free to re-use this basic Vite/TSX template for your own website
          <a
            href={`https://github.com/${GITHUB_USERNAME}/pfalexn`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.repoLink}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              width="18"
              height="18"
              style={{ marginRight: "6px", verticalAlign: "middle" }}
            >
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.69-.49-2.86-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82a7.6 7.6 0 012 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.001 8.001 0 008 0z" />
            </svg>
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
  subtitle: { fontSize: "1.2rem", opacity: 0.8 },
  text: { maxWidth: 600, textAlign: "center" },
  links: { display: "flex", gap: "1.5rem", marginTop: "1.5rem" },
  link: { color: "#2563eb", textDecoration: "none", fontWeight: 500 },
  projectList: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    marginTop: "2rem",
    maxWidth: "800px",
    width: "100%",
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
  },
  repoLink: {
    display: "inline-flex",
    alignItems: "center",
    color: "black",
    textDecoration: "none",
    fontWeight: 500,
  },

  footer: {
    marginTop: "4rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #e2e8f0",
    fontSize: "0.9rem",
    opacity: 0.7,
    textAlign: "center",
  },
};

export default App;
