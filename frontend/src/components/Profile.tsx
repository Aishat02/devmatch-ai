import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, username } = location.state || {};
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const steps = [
      `>> Initializing DevMatch AI for @${username}`,
      ">> Reading public GitHub repositories...",
      ">> Detecting primary tech stack...",
      ">> Generating summary insights...",
      `>> 👤 Username: ${username} `,
      `>> 📄 Bio: ${result.bio || "No bio"} `,
      `>> 👥 Followers: ${result.followers || 0} `,
      `>> 📂 Top Repositories:\n${result.repoSummary || "N/A"}`,
      `${result.aiText || "N/A"}`,
    ];

    let number = 0;

    const interval = setInterval(() => {
      if (number < steps.length) {
        setLines((prev) => [...prev, steps[number]]);
        number++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [username, result, navigate]);

  return (
    <div className="profile-page py-4 px-3">
      <div className="terminal">
        <div className="term-header">
          <span className="bg-orange"></span>
          <span className="bg-yellow"></span>
          <span className="bg-green"></span>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="term-line">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Profile;
