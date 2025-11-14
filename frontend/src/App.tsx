import NavBar from "./components/NavBar";
import HomePage from "./components/HomePage";
import AnalysisResult from "./components/Profile";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeContext } from "./components/context";

const App = () => {
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <NavBar />
        <Routes>
          <Route index path="/" element={<HomePage />} />
          <Route path="/profile" element={<AnalysisResult />} />
        </Routes>
        <Footer />
      </ThemeContext.Provider>
    </BrowserRouter>
  );
};

export default App;
