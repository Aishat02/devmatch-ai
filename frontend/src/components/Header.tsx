import { ThemeContext } from "./context";
import { useContext } from "react";

const Header = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <header data-box-shadow={theme} className="my-2 p-4 rounded-3">
      <p className="mb-0">
        DevMatch uses AI to analyze GitHub profiles, extract skillsets, provide
        job match scores if job description is provided, suggest ideal tech
        roles and level.
      </p>
    </header>
  );
};
export default Header;
