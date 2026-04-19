import { useState, useEffect } from "react";
import "./Loading.css";

const MESSAGES = [
  "Scanning 8 Indian banks for the best rates...",
  "Checking DICGC insurance limits...",
  "Matching maturity dates to your goals...",
  "Optimizing the ladder for maximum returns...",
  "Making sure every rupee is working...",
];

export default function Loading({ message }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 900);

    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 18, 92));
    }, 400);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-icon">
          <span className="loading-rupee">₹</span>
          <div className="loading-ring" />
        </div>
        <h2 className="loading-title">Building your plan</h2>
        <p className="loading-message">{message || MESSAGES[msgIndex]}</p>
        <div className="loading-progress">
          <div className="loading-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
