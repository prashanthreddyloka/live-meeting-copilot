import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMicRecorderOptions {
  chunkIntervalSeconds: number;
  onChunk: (audio: Blob, elapsedSeconds: number) => void;
  onPermissionError: (message: string) => void;
}

export const useMicRecorder = ({
  chunkIntervalSeconds,
  onChunk,
  onPermissionError,
}: UseMicRecorderOptions) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const onChunkRef = useRef(onChunk);
  const permissionErrorRef = useRef(onPermissionError);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  useEffect(() => {
    permissionErrorRef.current = onPermissionError;
  }, [onPermissionError]);

  const cleanup = useCallback(() => {
    mediaRecorderRef.current = null;
    recordingStartedAtRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined,
      });

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) {
          return;
        }

        const startedAt = recordingStartedAtRef.current ?? Date.now();
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        onChunkRef.current(event.data, elapsedSeconds);
      };

      recorder.onstop = () => {
        cleanup();
      };

      recorder.start(chunkIntervalSeconds * 1000);
      setIsRecording(true);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow mic access and try again.'
          : 'Unable to access your microphone. Check your browser permissions and device settings.';
      permissionErrorRef.current(message);
      cleanup();
    }
  }, [chunkIntervalSeconds, cleanup]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      cleanup();
      return;
    }

    if (recorder.state !== 'inactive') {
      recorder.stop();
      return;
    }

    cleanup();
  }, [cleanup]);

  const requestChunk = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state !== 'recording') {
      return;
    }

    recorder.requestData();
  }, []);

  useEffect(
    () => () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      cleanup();
    },
    [cleanup],
  );

  return {
    isRecording,
    startRecording,
    stopRecording,
    requestChunk,
  };
};
