import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./index.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        const response = await fetch("http://localhost:3030/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);
          navigate("/board");
        } else {
          alert(data.message || data.error || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login");
      }
    },
    [email, navigate, password],
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerWrap}>
          <p className={styles.eyebrow}>Welcome back</p>
          <h2 className={styles.title}>Login to your account</h2>
          <p className={styles.subtitle}>
            Continue working on your board ideas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Login
          </button>
        </form>

        <p className={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" className={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
