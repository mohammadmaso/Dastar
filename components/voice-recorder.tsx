"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { UserAudioComponent } from "@pipecat-ai/voice-ui-kit";
import { useAppStore } from "@/lib/store";

interface VoiceRecorderProps {
  onTranscript: (transcript: string, audioBlob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const { settings } = useAppStore();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<MediaDeviceInfo | undefined>();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Get available microphones on mount
  useEffect(() => {
    const getMicrophones = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((device) => device.kind === "audioinput");
        setAvailableMics(audioInputs);
        
        if (audioInputs.length > 0 && !selectedMic) {
          setSelectedMic(audioInputs[0]);
        }
      } catch (error) {
        console.error("Error getting microphones:", error);
      }
    };

    getMicrophones();
  }, [selectedMic]);

  const handleMicClick = useCallback(async () => {
    if (disabled || isProcessing) return;

    if (isMicEnabled) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsMicEnabled(false);
    } else {
      // Start recording
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedMic
            ? { deviceId: { exact: selectedMic.deviceId } }
            : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

          // Cleanup stream immediately
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          // Reset mic state
          setIsMicEnabled(false);

          // Send to transcription API
          setIsProcessing(true);
          try {
            // Try server-side API first
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");
            if (settings) {
              formData.append("settings", JSON.stringify(settings));
            }

            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              onTranscript(data.transcript, audioBlob);
            } else if (response.status === 404) {
              // API route not available, use client-side transcription
              const { transcribeAudio } = await import("@/lib/client-ai");
              const transcript = await transcribeAudio(audioBlob);
              onTranscript(transcript, audioBlob);
            } else {
              throw new Error("Transcription failed");
            }
          } catch (error) {
            console.error("Transcription error:", error);
            // Try client-side as fallback
            try {
              const { transcribeAudio } = await import("@/lib/client-ai");
              const transcript = await transcribeAudio(audioBlob);
              onTranscript(transcript, audioBlob);
            } catch (clientError) {
              console.error("Client-side transcription error:", clientError);
              onTranscript("", audioBlob);
            }
          } finally {
            setIsProcessing(false);
            // Ensure cleanup
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current = null;
            }
          }
        };

        mediaRecorder.onerror = (error) => {
          console.error("MediaRecorder error:", error);
          // Cleanup on error
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setIsMicEnabled(false);
          setIsProcessing(false);
        };

        mediaRecorder.start();
        setIsMicEnabled(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please grant permission.");
        // Cleanup on error
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setIsMicEnabled(false);
        setIsProcessing(false);
      }
    }
  }, [isMicEnabled, disabled, isProcessing, selectedMic, onTranscript, settings]);

  const handleMicChange = useCallback((deviceId: string) => {
    const mic = availableMics.find((m) => m.deviceId === deviceId);
    setSelectedMic(mic);
  }, [availableMics]);

  return (
    <span className="vkui-root">
    <UserAudioComponent
      onClick={handleMicClick}
      isMicEnabled={isMicEnabled}
      availableMics={availableMics}
      selectedMic={selectedMic}
      updateMic={handleMicChange}
      variant={isMicEnabled ? "destructive" : "outline"}
      size="md"
      activeText={isProcessing ? "Processing..." : "Listening"}
      inactiveText="Record"
      noVisualizer={false}
      noDevicePicker={false}
      buttonProps={{
        disabled: disabled || isProcessing,
        className: "shrink-0",
      }}
      
    />
    </span>
  );
}
