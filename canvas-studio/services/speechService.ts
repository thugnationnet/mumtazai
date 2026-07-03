/**
 * Speech service — uses Web Speech API for text-to-speech
 */

export async function speak(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn('[speechService] Web Speech API not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
