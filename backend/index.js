import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const ERROR_MESSAGES = {
  400: "Bad Request",
  401: "Unauthorized, authentication credentials missing or invalid",
  403: "Forbidden, rate limit exceeded or insufficient permissions",
  404: "Not Found",
  410: "Gone, resource no longer available",
  422: "Invalid parameter",
  429: "Too Many Requests, rate limit exceeded",
  500: "Internal Server Error, try again",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  529: "Overloaded API, delay and retry",
  598: "Network Read Timeout",
  599: "Network Connect Timeout",
};

let userReport = {
  status: "Pending",
  data: "Not available",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (
  url,
  retries = 3,
  delay = 1000,
  returnText = false
) => {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "DevMatch-AI",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });

    if (!res.ok) {
      if ((res.status === 429 || res.status === 529) && retries > 0) {
        console.log(`${res.status} → retry in ${delay / 1000}s`);
        await sleep(delay);
        return fetchWithRetry(url, retries - 1, delay * 2, returnText);
      }
      throw { status: res.status, message: ERROR_MESSAGES[res.status] };
    }

    return returnText ? res.text() : res.json();
  } catch (err) {
    if (retries > 0) {
      await sleep(delay);
      return fetchWithRetry(url, retries - 1, delay * 2, returnText);
    }
    throw {
      status: err.status || 500,
      message: err.message || ERROR_MESSAGES[500],
    };
  }
};

const userCache = new Map();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

const getCached = (username) => {
  const cached = userCache.get(username);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    userCache.delete(username);
    return null;
  }

  return cached.data;
};

const getCommitFrequency = async (owner, repo) => {
  try {
    const commits = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`
    );
    return commits.length;
  } catch {
    return 0;
  }
};

const getReadme = async (owner, repo) => {
  try {
    const readme = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/readme`
    );
    return Boolean(readme?.content);
  } catch {
    return false;
  }
};

/* Custom Scoring System*/

const scoreRepo = async (repo, username) => {
  const baseScore =
    repo.stargazers_count * 3 + repo.watchers_count * 2 + repo.forks_count * 2;

  const lowSignal = baseScore < 10;
  const weight = lowSignal ? 0.5 : 1;

  const [commitFreq, hasReadme] = await Promise.all([
    getCommitFrequency(username, repo.name),
    getReadme(username, repo.name),
  ]);

  const finalScore =
    baseScore * weight +
    commitFreq * 1.5 * weight +
    (repo.description ? 10 : 0) +
    (hasReadme ? 15 : 0);

  return {
    ...repo,
    score: finalScore,
    commitFreq,
    hasReadme,
  };
};

const normalizeScores = (repos) => {
  const max = Math.max(...repos.map((r) => r.score), 1);
  return repos.map((r) => ({
    ...r,
    normalizedScore: Math.round((r.score / max) * 100),
  }));
};

/* Pollination Text AI */

const getAIAnalysis = async (
  username,
  user,
  topRepos,
  repos,
  jobdescription
) => {

  const topReposFormatted = topRepos
    .map(
      (r) =>
        `  - ${r.name}: Score ${r.normalizedScore}, ` +
        `${r.commitFreq} recent commits, ` +
        `${r.hasReadme ? "Has README" : "No README"}, ` +
        `Language: ${r.language || "Not specified"}, ` +
        `Description: ${r.description || "No description"}`
    )
    .join("\n");

  const prompt = `
You are DevMatch AI, a recruiter assistant.

Analyze this GitHub profile and suggest:
- Summary analysis
- 3 best-fit tech roles
- Career level

GitHub User: ${username}
Bio: ${user.bio || "No bio"}
Followers: ${user.followers}

Top Repositories:
${topReposFormatted}
Repositories: ${topReposFormatted} ${
    repos.length > 10 ? `... and ${repos.length - 10} more repositories` : ""
  }

${jobdescription ? `Job description: ${jobdescription}` : ""}

Format:
>> Summary Analysis:
>> Recommended Job Roles:
>> Career Level:
`;

  const encodedPrompt = encodeURIComponent(prompt);

  try {
    return await fetchWithRetry(
      `https://text.pollinations.ai/${encodedPrompt}`,
      3,
      1000,
      true
    );
  } catch {
    return "AI analysis temporarily unavailable";
  }
};

app
  .route("/")
  .get((req, res) => {
    res.json(userReport);
  })
  .post(async (req, res) => {
    const { githubUsername, jobdescription } = req.body;

    if (!githubUsername) {
      return res
        .status(400)
        .json({ error: true, message: ERROR_MESSAGES[400] });
    }

    const cached = getCached(githubUsername);
    if (cached) return res.json(cached);

    try {
      const user = await fetchWithRetry(
        `https://api.github.com/users/${githubUsername}`
      );

      const repos = await fetchWithRetry(
        `https://api.github.com/users/${githubUsername}/repos`
      );

      const scored = await Promise.all(
        repos.map((repo) => scoreRepo(repo, githubUsername))
      );

      const normalized = normalizeScores(scored)
        .sort((a, b) => b.normalizedScore - a.normalizedScore)
        .slice(0, 5);

      console.table(
        normalized.map((r) => ({
          repo: r.name,
          score: r.normalizedScore,
          commits: r.commitFreq,
          readme: r.hasReadme,
        }))
      );

      const aiText = await getAIAnalysis(
        githubUsername,
        user,
        normalized,
        repos,
        jobdescription
      );

      userReport = {
        status: "Success",
        username: user.login,
        bio: user.bio,
        followers: user.followers,
        topRepos: normalized
          .map(
            (repo) =>
              `   * ${repo.name} — [${repo.language || "-"}]: ${
                repo.description || "No description"
              }`
          )
          .join("\n"),
        aiText,
        analyzedAt: new Date().toISOString(),
      };

      userCache.set(githubUsername, {
        data: userReport,
        timestamp: Date.now(),
      });

      res.json(userReport);
    } catch (err) {
      res.status(err.status || 500).json({
        error: true,
        status: err.status || 500,
        message: err.message || ERROR_MESSAGES[500],
        hint: "Try again!",
      });
    }
  });

app.listen(process.env.PORT);
