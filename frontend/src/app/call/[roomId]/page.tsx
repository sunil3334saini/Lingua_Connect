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
} from "lucide-react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

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

  // State
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [remoteUserName, setRemoteUserName] = useState("");

  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const cleanup = useCallback(() => {
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
    socket.on("user_joined_call", async (data: { userId: string; userName: string }) => {
      setRemoteUserName(data.userName);
      // Create offer when someone joins
      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit("webrtc_offer", {
          roomId,
          offer,
          senderId: user.id,
        });
      }
    });

    socket.on("webrtc_offer", async (data: { offer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) await createPeerConnection();
      await peerConnectionRef.current!.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      socket.emit("webrtc_answer", {
        roomId,
        answer,
        senderId: user.id,
      });
    });

    socket.on("webrtc_answer", async (data: { answer: RTCSessionDescriptionInit }) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    socket.on("webrtc_ice_candidate", async (data: { candidate: RTCIceCandidateInit }) => {
      if (data.candidate) {
        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
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

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("webrtc_ice_candidate", {
          roomId,
          candidate: event.candidate,
          senderId: user?.id,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setIsConnected(true);
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

  const endCall = () => {
    cleanup();
    router.push("/dashboard");
  };

  const sendMessage = (e: React.FormEvent) => {
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
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition"
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
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
        <div className="w-80 bg-white flex flex-col border-l">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-gray-600"
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
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none text-gray-900"
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
