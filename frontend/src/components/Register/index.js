import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./index.module.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3030/api/users/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          alert("Registration successful");
          navigate("/login");
        } else {
          alert(data.message || data.error || "Registration failed");
        }
      } catch (error) {
        console.error("Registration error: ", error);
        alert("An error occurred during registration");
      }
    },
    [confirmPassword, email, name, navigate, password],
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerWrap}>
          <p className={styles.eyebrow}>Welcome</p>
          <h2 className={styles.title}>Create your account</h2>
          <p className={styles.subtitle}>
            Start collaborating on your whiteboard ideas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

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

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Register
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" className={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
