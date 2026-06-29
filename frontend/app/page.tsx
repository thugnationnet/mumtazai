'use client';

export default function RootChatPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      <iframe
        src="https://demo.mumtaz.ai"
        className="w-full h-full border-0"
        allow="microphone; camera; clipboard-write; clipboard-read"
        title="Mumtaz AI Chat"
      />
    </div>
  );
}
