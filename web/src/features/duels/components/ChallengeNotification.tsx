import React, { useEffect, useRef, useState } from "react";
import { useDuel } from "@features/duels/context/DuelContext";
import "@features/duels/styles/DuelsScreen.css";

const ChallengeNotification: React.FC = () => {
  const { pendingChallenge, acceptChallenge, declineChallenge } = useDuel();
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pendingChallenge) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimeLeft(0);
      return;
    }

    setTimeLeft(pendingChallenge.expires_in);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pendingChallenge?.challenge_id]);

  if (!pendingChallenge) return null;

  return (
    <div className="challenge-notif-banner">
      <h4 className="challenge-notif-title">⚔️ Défi reçu !</h4>
      <p className="challenge-notif-msg">
        <strong>{pendingChallenge.from_username}</strong> te défie en duel !
      </p>
      <span className="challenge-notif-timer">
        Expire dans {timeLeft}s
      </span>
      <div className="challenge-notif-actions">
        <button className="challenge-accept-btn" onClick={acceptChallenge}>
          ✅ Accepter
        </button>
        <button className="challenge-decline-btn" onClick={declineChallenge}>
          ❌ Décliner
        </button>
      </div>
    </div>
  );
};

export default ChallengeNotification;
