import logo from "/src/assets/octocat.png";
import { LuSun, LuMoon } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "./context";

const NavBar = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <nav className="navbar px-3 bg-light">
      <Link
        to="/"
        className="navbar-brand fw-semibold d-flex gap-2 align-items-center "
      >
        <img src={logo} width={35} />
        DevMatch
      </Link>
      <button
        className="navbar-toggler border-0"
        type="button"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "dark" ? <LuSun size={22} /> : <LuMoon size={22} />}
      </button>
    </nav>
  );
};

export default NavBar;
