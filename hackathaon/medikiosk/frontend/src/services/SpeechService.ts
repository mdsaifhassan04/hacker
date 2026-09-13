export interface SpeechServiceOptions {
  language: 'en' | 'hi';
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string) => void;
  onEnd: () => void;
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  public isDemoMode: boolean = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      } catch {
        this.isDemoMode = true;
      }
    } else {
      this.isDemoMode = true;
    }
  }

  public start(options: SpeechServiceOptions) {
    const { language, onResult, onError, onEnd } = options;

    if (this.isDemoMode || !this.recognition) {
      // DEMO_MODE Fallback Simulation
      this.isListening = true;
      const demoPhrasesEn = [
        'Fever and chest pain for 2 days',
        'Severe headache and dizziness since morning',
        'Cough with breathing difficulty and mild fever',
      ];
      const demoPhrasesHi = [
        '2 दिनों से बुखार और छाती में दर्द',
        'सुबह से तेज सिरदर्द और चक्कर',
        'खांसी और सांस लेने में तकलीफ के साथ बुखार',
      ];

      const selectedPhrase =
        language === 'hi'
          ? demoPhrasesHi[Math.floor(Math.random() * demoPhrasesHi.length)]
          : demoPhrasesEn[Math.floor(Math.random() * demoPhrasesEn.length)];

      setTimeout(() => {
        onResult(selectedPhrase, true);
        this.isListening = false;
        onEnd();
      }, 1500);
      return;
    }

    this.recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }

      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let errorMsg = 'Recognition error occurred.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission denied. Switching to DEMO_MODE.';
        this.isDemoMode = true;
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please speak louder into the microphone.';
      } else if (event.error === 'network') {
        errorMsg = 'Network connection issue during speech recognition.';
      }
      onError(errorMsg);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.isListening = true;
      this.recognition.start();
    } catch {
      this.isListening = false;
      this.isDemoMode = true;
      // Trigger demo fallback
      this.start(options);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }
}
