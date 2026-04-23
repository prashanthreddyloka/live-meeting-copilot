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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const onChunkRef = useRef(onChunk);
  const permissionErrorRef = useRef(onPermissionError);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');

  useEffect(() => { onChunkRef.current = onChunk; }, [onChunk]);
  useEffect(() => { permissionErrorRef.current = onPermissionError; }, [onPermissionError]);

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.onend = null;
    rec.onresult = null;
    rec.abort();
    recognitionRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    mediaRecorderRef.current = null;
    recordingStartedAtRef.current = null;
    setElapsedSeconds(0);
    setInterimText('');
    stopRecognition();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, [stopRecognition]);

  const startSpeechRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setInterimText(text.trim());
    };

    recognition.onerror = () => {};

    // Restart on natural end so recognition stays continuous
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  // Restart recognition to clear accumulated results from SpeechRecognition
  const clearInterim = useCallback(() => {
    setInterimText('');
    stopRecognition();
    startSpeechRecognition();
  }, [stopRecognition, startSpeechRecognition]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined,
      });

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setElapsedSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) return;
        const startedAt = recordingStartedAtRef.current ?? Date.now();
        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        onChunkRef.current(event.data, elapsed);
      };

      recorder.onstop = () => { cleanup(); };

      recorder.start(chunkIntervalSeconds * 1000);
      setIsRecording(true);
      startSpeechRecognition();
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow mic access and try again.'
          : 'Unable to access your microphone. Check your browser permissions and device settings.';
      permissionErrorRef.current(message);
      cleanup();
    }
  }, [chunkIntervalSeconds, cleanup, startSpeechRecognition]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) { cleanup(); return; }
    if (recorder.state !== 'inactive') { recorder.stop(); return; }
    cleanup();
  }, [cleanup]);

  const requestChunk = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.requestData();
  }, []);

  useEffect(
    () => () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      cleanup();
    },
    [cleanup],
  );

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;
      setElapsedSeconds(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  return {
    isRecording,
    elapsedSeconds,
    interimText,
    clearInterim,
    startRecording,
    stopRecording,
    requestChunk,
  };
};
