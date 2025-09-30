"use client";
import { showConfirmation } from "@/lib/modal";
import type { MuxPlayerRefAttributes } from "@mux/mux-player-react";
import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useRef, useState } from "react";

export default function VideoExercisePage() {
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoSkipped, setVideoSkipped] = useState(false);
  const playerRef = useRef<MuxPlayerRefAttributes>(null);

  useEffect(() => {
    if (playerRef.current) {
      void playerRef.current.play();
    }
  }, []);

  const handleVideoEnd = () => {
    setVideoWatched(true);
  };

  const handleSkipClick = () => {
    showConfirmation({
      title: "Skip Video",
      message: "Are you sure you want to skip the video?",
      variant: "default",
      onConfirm: () => {
        setVideoSkipped(true);
        setVideoWatched(true);
        if (playerRef.current) {
          playerRef.current.pause();
        }
      }
    });
  };

  const handleContinue = () => {
    // TODO: Navigate to next exercise or complete the current one
    window.alert("Video completed! Ready to continue to the next step.");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Welcome!</h1>
      <div className="w-full max-w-4xl relative">
        {/* Reserve space with aspect ratio to prevent layout shift */}
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <MuxPlayer
            ref={playerRef}
            playbackId="PNbgUkVhy38y7OELdYseo1GAD01XG8FGLJ1nj9BvuKCU"
            streamType="on-demand"
            title="Your next lesson"
            autoPlay
            loop={false}
            muted={false}
            volume={0.5}
            className="absolute inset-0 w-full h-full"
            onEnded={handleVideoEnd}
          />
        </div>
      </div>
      <div className="flex gap-4 mt-8">
        {!videoWatched && !videoSkipped && (
          <button
            onClick={handleSkipClick}
            className="px-6 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Skip Video
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={!videoWatched}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            videoWatched ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
