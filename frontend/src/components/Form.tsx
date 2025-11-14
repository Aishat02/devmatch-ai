import { useForm } from "react-hook-form";
import { FaGithub } from "react-icons/fa6";
import { ThemeContext } from "./context";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Profile {
  githubUsername: string;
  jobDescription?: string;
}

const Form = () => {
  const [characterLength, setCharacterLength] = useState<number>(10000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { theme } = useContext(ThemeContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Profile>();

  const navigate = useNavigate();

  const onSubmit = async (data: Profile) => {
    setIsLoading(true);
    console.log(data);
    try {
      const response = await fetch("http://localhost:3173/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        throw new Error(`❌ ${result.message}`);
      }

      navigate("/profile", {
        state: { result, username: data.githubUsername },
      });
    } catch (err: any) {
      setIsLoading(false);
      alert(`${err.message}`);
    }
  };

  return (
    <form
      data-box-shadow={theme}
      onSubmit={handleSubmit(onSubmit)}
      className="mt-4 p-4 rounded-3 custom-box-shadow"
    >
      <div className="row g-3">
        <div className="col-md mb-2">
          <label htmlFor="githubUsername" className="form-label">
            GitHub username <span className="text-danger">*</span>
          </label>
          <div className="input-group mb-2">
            <span className="input-group-text">
              <FaGithub />
            </span>
            <input
              type="text"
              className="form-control"
              id="githubUsername"
              placeholder="vercel"
              {...register("githubUsername", { required: true })}
            />
          </div>
          {errors.githubUsername && (
            <span className="text-danger fs-0">
              GitHub username is required
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <label htmlFor="jobdescription" className="form-label">
          Job Description (optional)
        </label>
        <textarea
          className="form-control"
          id="jobDescription"
          rows={4}
          maxLength={characterLength}
          {...register("jobDescription")}
          placeholder="Paste a job description here..."
          onChange={(event) =>
            setCharacterLength(characterLength - event.target.value.length)
          }
        />
      </div>

      <div className="mb-3 text-end fs-12 text-muted">
        {characterLength} characters left
      </div>
      <button type="submit" className="btn btn-primary w-100">
        {isLoading ? (
          <>
            <span role="status">Analyzing...</span>{" "}
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            ></span>
          </>
        ) : (
          "Analyze Profile"
        )}
      </button>
    </form>
  );
};

export default Form;
