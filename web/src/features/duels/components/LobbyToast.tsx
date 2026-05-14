import React, { useEffect, useRef } from "react";
import { useDuel } from "@features/duels/context/DuelContext";
import "@features/duels/styles/DuelsScreen.css";

type ToastVariant = "success" | "error" | "warning" | "info";

function detectVariant(msg: string): ToastVariant {
  if (msg.startsWith("✅")) return "success";
  if (msg.startsWith("❌")) return "error";
  if (msg.startsWith("⚠️") || msg.startsWith("⏰")) return "warning";
  return "info";
}

const LobbyToast: React.FC = () => {
  const { lobbyStatus, setLobbyStatus } = useDuel();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lobbyStatus) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLobbyStatus(""), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lobbyStatus, setLobbyStatus]);

  if (!lobbyStatus) return null;

  const variant = detectVariant(lobbyStatus);

  return (
    <div
      className={`lobby-toast lobby-toast-${variant}`}
      role="status"
      onClick={() => setLobbyStatus("")}
    >
      <span className="lobby-toast-msg">{lobbyStatus}</span>
      <button className="lobby-toast-close" aria-label="Fermer">✕</button>
    </div>
  );
};

export default LobbyToast;
