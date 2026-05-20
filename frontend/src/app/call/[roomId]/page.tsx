"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { connectSocket } from "@/lib/socket";
import { ChatMessage } from "@/types";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  Send,
  X,
  Monitor,
} from "lucide-react";

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl && turnUser && turnCred) {
    servers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
  }

  return servers;
}

const ICE_SERVERS: RTCConfiguration = { iceServers: buildIceServers() };

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user, isAuthenticated, loadFromStorage } = useAuthStore();

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomFull, setRoomFull] = useState(false);
  const [quality, setQuality] = useState<"good" | "poor" | "bad" | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [remoteUserName, setRemoteUserName] = useState("");

  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const cleanup = useCallback(() => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.emit("end_call", { roomId, userId: user?.id });
    socketRef.current?.emit("leave_room", roomId);
  }, [roomId, user?.id]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = connectSocket(user.id);
    socketRef.current = socket;

    // Join room
    socket.emit("join_room", roomId);
    socket.emit("join_call", {
      roomId,
      userId: user.id,
      userName: user.name,
    });

    // Start local media
    startLocalStream();

    // Socket event handlers

    // Peer 1 path: peer 2 just joined — store their socketId and send offer
    socket.on("user_joined_call", async (data: { userId: string; userName: string; socketId: string }) => {
      setRemoteUserName(data.userName);
      remoteSocketIdRef.current = data.socketId;
      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit("webrtc_offer", {
          roomId,
          offer,
          senderId: user.id,
          targetSocketId: data.socketId,
        });
      }
    });

    // Peer 2 path: server confirms who the other peer is (no offer sent here)
    socket.on("peer_info", (data: { userId: string; userName: string; socketId: string }) => {
      setRemoteUserName(data.userName);
      remoteSocketIdRef.current = data.socketId;
    });

    // Room is already full — show error and redirect
    socket.on("room_full", () => {
      setRoomFull(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    });

    socket.on("webrtc_offer", async (data: { offer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      remoteSocketIdRef.current = data.senderSocketId;
      if (!peerConnectionRef.current) await createPeerConnection();
      await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      socket.emit("webrtc_answer", {
        roomId,
        answer,
        senderId: user.id,
        targetSocketId: data.senderSocketId,
      });
    });

    socket.on("webrtc_answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("webrtc_ice_candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      if (data.candidate) {
        await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    socket.on("receive_message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("call_ended", () => {
      setIsConnected(false);
      cleanup();
      router.push("/dashboard");
    });

    return () => {
      cleanup();
    };
  }, [isAuthenticated, user, roomId, cleanup, router]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      await createPeerConnection();
    } catch (err) {
      console.error("Failed to get local stream:", err);
    }
  };

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
    };

    // Handle ICE candidates — route directly to the known peer
    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketIdRef.current) {
        socketRef.current?.emit("webrtc_ice_candidate", {
          roomId,
          candidate: event.candidate,
          senderId: user?.id,
          targetSocketId: remoteSocketIdRef.current,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        // Poll RTCStats every 4 s for a simple packet-loss quality signal
        statsIntervalRef.current = setInterval(async () => {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type === "inbound-rtp" && report.kind === "video") {
              const loss = report.packetsLost ?? 0;
              const recv = report.packetsReceived ?? 1;
              const lossRate = loss / (loss + recv);
              if (lossRate < 0.02) setQuality("good");
              else if (lossRate < 0.08) setQuality("poor");
              else setQuality("bad");
            }
          });
        }, 4000);
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        setQuality(null);
      }
    };

    return pc;
  };

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsAudioOn(!isAudioOn);
    socketRef.current?.emit("toggle_media", {
      roomId,
      userId: user?.id,
      type: "audio",
      enabled: !isAudioOn,
    });
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoOn(!isVideoOn);
    socketRef.current?.emit("toggle_media", {
      roomId,
      userId: user?.id,
      type: "video",
      enabled: !isVideoOn,
    });
  };

  const toggleScreenShare = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Restore camera track
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(camTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        // Auto-stop when user clicks browser's "Stop sharing"
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch {
        // user cancelled or permission denied — silent
      }
    }
  };

  const endCall = () => {
    cleanup();
    router.push("/dashboard");
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const msgData = {
      roomId,
      senderId: user!.id,
      senderName: user!.name,
      message: messageInput,
      timestamp: new Date().toISOString(),
    };

    socketRef.current?.emit("send_message", msgData);
    setMessageInput("");
  };

  if (!isAuthenticated) return null;

  if (roomFull) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-3">
          <p className="text-white text-xl font-semibold">This call is full</p>
          <p className="text-gray-400 text-sm">Only 2 participants are allowed. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-900">
      {/* Video Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-xl bg-gray-800"
          />

          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">
                  Waiting for {remoteUserName || "other participant"}...
                </p>
              </div>
            </div>
          )}

          {/* Connection quality badge */}
          {quality && (
            <div className="absolute top-3 left-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  quality === "good"
                    ? "bg-green-500/80 text-white"
                    : quality === "poor"
                    ? "bg-yellow-500/80 text-white"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {quality === "good" ? "● Good" : quality === "poor" ? "● Poor" : "● Bad"} signal
              </span>
            </div>
          )}

          {/* Remote participant name */}
          {isConnected && remoteUserName && (
            <div className="absolute bottom-4 left-4">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                {remoteUserName}
              </span>
            </div>
          )}

          {/* Local Video (PiP) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-gray-700"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              You
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-800/80">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              isAudioOn
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-red-600 hover:bg-red-500"
            } text-white transition`}
          >
            {isAudioOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOn
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-red-600 hover:bg-red-500"
            } text-white transition`}
          >
            {isVideoOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
            className={`p-3 rounded-full ${
              isScreenSharing
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-gray-600 hover:bg-gray-500"
            } text-white transition`}
          >
            <Monitor className="h-5 w-5" />
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition"
          >
            <Phone className="h-5 w-5 rotate-135" />
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full ${
              showChat
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-gray-600 hover:bg-gray-500"
            } text-white transition`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-80 bg-white dark:bg-gray-800 flex flex-col border-l dark:border-gray-700">
          <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${
                  msg.senderId === user?.id ? "text-right" : "text-left"
                }`}
              >
                <p className="text-xs text-gray-400 mb-0.5">
                  {msg.senderId === user?.id ? "You" : msg.senderName}
                </p>
                <div
                  className={`inline-block px-3 py-1.5 rounded-lg text-sm ${
                    msg.senderId === user?.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none text-gray-900 dark:text-white dark:bg-gray-700"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
