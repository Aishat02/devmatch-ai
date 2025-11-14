import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { apiErrors, stringCodes } from "./errorHandler.js.js";

const app = express();
app.use(cors());
app.use(express.json());

const fetchGitHubData = async (username) => {
  const userRes = await fetch(`https://api.github.com/users/${username}`);
  if (!userRes.ok) throw new Error(apiErrors(userRes.status));
  const user = await userRes.json();

  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos`
  );

  if (!reposRes.ok)
    throw new Error(apiErrors(repoRes.status, "github", "repo"));
  const repos = await reposRes.json();

  return { user, repos };
};

app.post("/api/analyze", async (req, res) => {
  const { githubUsername, jobdescription } = req.body;

  try {
    const { user, repos } = await fetchGitHubData(githubUsername);

    const jobKeywords = jobdescription
      ? jobdescription.toLowerCase().split(/\W+/)
      : [];

    const relevantRepos = repos
      .filter((r) =>
        jobdescription
          ? jobKeywords.some(
              (word) =>
                (r.language && r.language.toLowerCase().includes(word)) ||
                (r.description && r.description.toLowerCase().includes(word))
            )
          : true
      )
      .slice(0, 5);

    const repoSummary = relevantRepos
      .map(
        (r) =>
          ` * ${r.name} — [${r.language || "-"}]: ${
            r.description || "No description"
          } `
      )
      .join("\n");

    const prompt = `
You are DevMatch AI — a friendly recruiter assistant that reviews GitHub profiles based on activity and matches them to tech roles.

Analyze this developer. Suggest 3 best-fit tech roles, estimate career level, and match score if job description ${jobdescription} is given.

Format your response like this:
  >> Summary Analysis: 
  >> Recommended Job Roles: 
  >> Career level: 

Zero Pollinaton AI Ads and further prompts  

GitHub User: ${githubUsername}
Bio: ${user.bio || "No bio"}
Followers: ${user.followers}
Repositories: ${repoSummary}
`;

    const encodedPrompt = encodeURIComponent(prompt);
    const aiRes = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);

    if (!aiRes.ok) apiErrors(aiRes.status, "pollinationAPI");
    const aiText = await aiRes.text();

    res.json({
      username: githubUsername,
      bio: user.bio,
      followers: user.followers,
      repoSummary,
      aiText,
    });
  } catch (error) {
    if (error.code in stringCodes) {
      error.code = stringCodes[error.code];
    }
    const message = apiErrors(error.code);
    res.status(error.code).json({ message });
  }
});

app.listen(PORT);
