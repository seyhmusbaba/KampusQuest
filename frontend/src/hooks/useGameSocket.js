import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { getSocketURL } from "../utils/api";

export function useGameSocket(token, callbacks = {}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(callbacks);
  useEffect(() => { cbRef.current = callbacks; });

  useEffect(() => {
    if (!token) return;

    const url = getSocketURL();
    const socket = io(url, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 15,
    });
    socketRef.current = socket;

    socket.on("connect",       () => setConnected(true));
    socket.on("disconnect",    () => setConnected(false));
    socket.on("connect_error", (e) =>
      cbRef.current.onError?.({ message: "Sunucuya bağlanılamadı: " + e.message })
    );

    const ev = (name, cb) => socket.on(name, (d) => cbRef.current[cb]?.(d));
    ev("init",                   "onInit");
    ev("player:moved",           "onPlayerMoved");
    ev("player:joined",          "onPlayerJoined");
    ev("player:disconnected",    "onPlayerDisconnected");
    ev("player:xp_update",       "onXPUpdate");
    ev("chat:message",           "onChatMessage");
    ev("chat:message_deleted",   "onMessageDeleted");
    ev("xp:gained",              "onXPGained");
    ev("xp:cooldown",            "onXPCooldown");
    ev("level:up",               "onLevelUp");
    ev("daily:bonus",            "onDailyBonus");
    ev("quest:completed",        "onQuestCompleted");
    ev("quest:claimed",          "onQuestClaimed");
    ev("quest:progress_update",  "onQuestProgressUpdate");
    ev("admin:success",          "onAdminSuccess");
    ev("hidden:found",           "onHiddenFound");
    ev("npc:nearby",             "onNPCNearby");
    ev("npc:away",               "onNPCAway");
    ev("error",                  "onError");
    ev("server:stats",           "onServerStats");
    ev("team:created",           "onTeamCreated");
    ev("team:joined",            "onTeamJoined");
    ev("team:left",              "onTeamLeft");
    ev("friend:list",            "onFriendList");
    ev("friend:request_sent",    "onFriendSent");
    ev("friend:accepted",        "onFriendAccepted");
    ev("friend:incoming_request","onFriendIncoming");

    socket.on("banned", (d) => {
      alert("Hesabınız askıya alındı: " + (d.reason || ""));
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const sendMove   = useCallback((lat, lng, x, y) => socketRef.current?.emit("player:move", { lat, lng, x, y }), []);
  const sendChat   = useCallback((roomId, content) => socketRef.current?.emit("chat:send", { roomId, content }), []);
  const claimQuest = useCallback((questId)          => socketRef.current?.emit("quest:claim", { questId }), []);

  return { connected, sendMove, sendChat, claimQuest, socket: socketRef.current };
}
