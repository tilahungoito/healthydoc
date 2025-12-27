'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Send,
  Download,
  Mic,
  MicOff,
  Loader2,
  Bot,
  User,
} from 'lucide-react';
import { authClient } from '@/lib/auth/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isFollowUp?: boolean;
}

interface ConsultationState {
  sessionId: string | null;
  messages: Message[];
  isActive: boolean;
  isComplete: boolean;
  medicalReceipt: any | null;
}

export default function AIDoctorPage() {
  const { data: session } = authClient.useSession();
  const [consultation, setConsultation] = useState<ConsultationState>({
    sessionId: null,
    messages: [],
    isActive: false,
    isComplete: false,
    medicalReceipt: null,
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callMode, setCallMode] = useState<'none' | 'audio' | 'video'>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'am' | 'ti'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [consultation.messages]);

  // Auto-fetch receipt and show summary when consultation completes
  useEffect(() => {
    const fetchReceiptAndShowSummary = async () => {
      if (consultation.isComplete && consultation.sessionId && !consultation.medicalReceipt) {
        try {
          const receiptResponse = await fetch(
            `/api/ai-doctor/receipt/${consultation.sessionId}`,
            { method: 'POST', // Use POST to send conversation as fallback
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationMessages: consultation.messages.map(msg => ({
                  role: msg.role,
                  content: msg.content,
                })),
              }),
            }
          );

          if (receiptResponse.ok) {
            const receiptData = await receiptResponse.json();
            setConsultation((prev) => ({
              ...prev,
              medicalReceipt: receiptData,
            }));
            setIsSummaryModalOpen(true);
          }
        } catch (error) {
          console.error('Error auto-fetching receipt:', error);
        }
      } else if (consultation.isComplete && consultation.medicalReceipt) {
        // If receipt already exists, just show the modal
        setIsSummaryModalOpen(true);
      }
    };

    fetchReceiptAndShowSummary();
  }, [consultation.isComplete, consultation.sessionId, consultation.medicalReceipt]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Speak AI response using text-to-speech
  const speakText = (text: string, language: string = 'en') => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on selection
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'am': 'am-ET', // Amharic
      'ti': 'ti-ET', // Tigrinya (may not be available in all browsers)
    };
    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Start voice recognition
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    const langMap: Record<string, string> = {
      'en': 'en-US',
      'am': 'am-ET',
      'ti': 'ti-ET',
    };

    recognition.lang = langMap[selectedLanguage] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((prev) => prev ? `${prev} ${transcript}` : transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'no-speech') {
        alert('No speech detected. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop voice recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const startConsultation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-doctor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to start consultation');

      const data = await response.json();
      setConsultation({
        sessionId: data.sessionId,
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: data.initialMessage || "Hello! I'm your AI doctor. How can I help you today? Please describe your symptoms or health concerns.",
            timestamp: new Date(),
          },
        ],
        isActive: true,
        isComplete: false,
        medicalReceipt: null,
      });
    } catch (error) {
      console.error('Error starting consultation:', error);
      alert('Failed to start consultation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopConsultation = async () => {
    if (callMode !== 'none') {
      stopCall();
    }

    setIsLoading(true);
    try {
      if (consultation.sessionId) {
        // First, try to get or generate the medical receipt/summary
        try {
          // If we already have a receipt from the consultation, use it
          if (consultation.medicalReceipt) {
            setConsultation((prev) => ({
              ...prev,
              isComplete: true,
            }));
            setIsSummaryModalOpen(true);
          } else {
            // Try to fetch/generate receipt from backend
            const receiptResponse = await fetch(
              `/api/ai-doctor/receipt/${consultation.sessionId}`,
              { 
                method: 'POST', // Use POST to send conversation data if needed
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  // Send conversation messages as fallback if backend context is missing
                  conversationMessages: consultation.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                  })),
                }),
              }
            );

            if (receiptResponse.ok) {
              const receiptData = await receiptResponse.json();
              // Update consultation with receipt and mark as complete
              setConsultation((prev) => ({
                ...prev,
                isComplete: true,
                medicalReceipt: receiptData,
              }));
              // Open summary modal automatically
              setIsSummaryModalOpen(true);
            } else {
              console.warn('Receipt not available, ending consultation without summary');
              // Still end the consultation
              await fetch(`/api/ai-doctor/end/${consultation.sessionId}`, {
                method: 'POST',
              });
              setConsultation({
                sessionId: null,
                messages: [],
                isActive: false,
                isComplete: false,
                medicalReceipt: null,
              });
            }
          }
        } catch (receiptError) {
          console.error('Error fetching receipt:', receiptError);
          // Continue to end consultation even if receipt fetch fails
          await fetch(`/api/ai-doctor/end/${consultation.sessionId}`, {
            method: 'POST',
          });
          setConsultation({
            sessionId: null,
            messages: [],
            isActive: false,
            isComplete: false,
            medicalReceipt: null,
          });
        }
      } else {
        // No session, just reset locally
        setConsultation({
          sessionId: null,
          messages: [],
          isActive: false,
          isComplete: false,
          medicalReceipt: null,
        });
      }
    } catch (error) {
      console.error('Error ending consultation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSummaryAndEnd = async () => {
    setIsSummaryModalOpen(false);
    // Now actually clear the server-side context
    if (consultation.sessionId) {
      try {
        await fetch(`/api/ai-doctor/end/${consultation.sessionId}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error clearing context:', error);
      }
    }
    // Reset consultation locally
    setConsultation({
      sessionId: null,
      messages: [],
      isActive: false,
      isComplete: false,
      medicalReceipt: null,
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !consultation.sessionId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setConsultation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-doctor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: consultation.sessionId,
          message: inputMessage,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Ensure we always have a response
      const responseText = data.response || data.error || 'I apologize, but I encountered an issue. Could you please repeat your message?';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isFollowUp: data.isFollowUp,
      };

      setConsultation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isComplete: data.isComplete || false,
        medicalReceipt: data.medicalReceipt || null,
      }));

      // When the AI marks the consultation as complete / processed,
      // automatically show the medical analysis summary (not every turn)
      if (data.isComplete || data.medicalReceipt) {
        setIsSummaryModalOpen(true);
      }

      // Speak the AI response
      if (responseText && !data.error) {
        speakText(responseText, selectedLanguage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setConsultation((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const startAudioCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setCallMode('audio');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCallMode('video');
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setCallMode('none');
  };

  const downloadMedicalReceipt = async (format: 'pdf' | 'txt' | 'json' = 'pdf') => {
    if (!consultation.sessionId) return;

    try {
      // If we have receipt data in state, use it; otherwise fetch from API
      let receiptData = consultation.medicalReceipt;
      
      if (!receiptData) {
        const response = await fetch(`/api/ai-doctor/receipt/${consultation.sessionId}`, {
          method: 'GET',
        });

        if (!response.ok) throw new Error('Failed to generate receipt');

        receiptData = await response.json();
      }

      if (!receiptData) {
        throw new Error('No receipt data available');
      }

      const fileBaseName = `medical-consultation-${receiptData.sessionId}`;
      const prescriptions: string[] = receiptData.prescriptions || [];
      const diagnosisText: string | undefined = (receiptData as any).diagnosis;

      if (format === 'pdf') {
        // Generate PDF using jspdf (client-side)
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Professional header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('MEDICAL CONSULTATION SUMMARY', 105, 18, { align: 'center' });

        doc.setDrawColor(60, 72, 88);
        doc.setLineWidth(0.4);
        doc.line(20, 22, 190, 22);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Session ID: ${receiptData.sessionId}`, 20, 30);
        doc.text(`Date: ${new Date(receiptData.date).toLocaleDateString()}`, 20, 36);
        doc.text(`Urgency: ${receiptData.urgency.toUpperCase()}`, 20, 42);

        let yPos = 52;

        // Clinical summary
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Clinical Summary', 20, yPos);
        yPos += 8;
        
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(
          receiptData.summary || 'No summary available',
          170
        );
        doc.text(summaryLines, 20, yPos);
        yPos += summaryLines.length * 6 + 6;

        // Possible diagnosis paragraph (if available)
        if (diagnosisText && diagnosisText.trim().length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('Possible Diagnosis', 20, yPos);
          yPos += 8;

          doc.setFont('times', 'normal');
          doc.setFontSize(11);
          const diagnosisLines = doc.splitTextToSize(diagnosisText, 170);
          doc.text(diagnosisLines, 20, yPos);
          yPos += diagnosisLines.length * 6 + 6;
        }

        // Recommendations / health tips as a flowing paragraph list
        if (receiptData.recommendations && receiptData.recommendations.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('Recommendations & Health Advice', 20, yPos);
          yPos += 8;
          
          doc.setFont('times', 'normal');
          doc.setFontSize(11);
          const recParagraph = receiptData.recommendations
            .map((rec: string, i: number) => `${i + 1}. ${rec}`)
            .join('  ');
          const recLines = doc.splitTextToSize(recParagraph, 170);
          doc.text(recLines, 20, yPos);
          yPos += recLines.length * 6 + 6;
        }

        // Prescriptions (if any)
        if (prescriptions.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('Prescriptions', 20, yPos);
          yPos += 8;

          doc.setFont('times', 'normal');
          doc.setFontSize(11);
          const presParagraph = prescriptions
            .map((pres: string, i: number) => `${i + 1}. ${pres}`)
            .join('  ');
          const presLines = doc.splitTextToSize(presParagraph, 170);
          doc.text(presLines, 20, yPos);
          yPos += presLines.length * 6 + 6;
        }

        // Disclaimer
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Disclaimer', 20, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const disclaimer = 'This AI-generated consultation summary is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment.';
        const disclaimerLines = doc.splitTextToSize(disclaimer, 170);
        doc.text(disclaimerLines, 20, yPos);

        // Save PDF
        doc.save(`${fileBaseName}.pdf`);
      } else if (format === 'txt') {
        const lines: string[] = [];
        lines.push('MEDICAL CONSULTATION SUMMARY');
        lines.push(`Session ID: ${receiptData.sessionId}`);
        lines.push(`Date: ${new Date(receiptData.date).toLocaleString()}`);
        lines.push(`Urgency Level: ${receiptData.urgency.toUpperCase()}`);
        lines.push('');
        lines.push('CLINICAL SUMMARY');
        lines.push(receiptData.summary || 'No summary available');
        lines.push('');
        if (diagnosisText && diagnosisText.trim().length > 0) {
          lines.push('POSSIBLE DIAGNOSIS');
          lines.push(diagnosisText);
        }
        lines.push('');
        if (receiptData.recommendations?.length) {
          lines.push('RECOMMENDATIONS & HEALTH TIPS');
          receiptData.recommendations.forEach((rec: string, i: number) => {
            lines.push(`${i + 1}. ${rec}`);
          });
          lines.push('');
        }
        if (prescriptions.length) {
          lines.push('PRESCRIPTIONS');
          prescriptions.forEach((pres: string, i: number) => {
            lines.push(`${i + 1}. ${pres}`);
          });
          lines.push('');
        }
        lines.push('DISCLAIMER:');
        lines.push('This AI-generated consultation summary is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment.');

        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileBaseName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
          type: 'application/json;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileBaseName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download medical summary.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-indigo-600" />
              AI Doctor Consultation
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time consultation with AI medical assistant
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!consultation.isActive ? (
              <button
                onClick={startConsultation}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Start Consultation
                  </>
                )}
              </button>
            ) : (
              <>
                {callMode === 'none' && (
                  <>
                    <button
                      onClick={startAudioCall}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      title="Start Audio Call"
                    >
                      <Phone className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={startVideoCall}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      title="Start Video Call"
                    >
                      <Video className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
                {(callMode === 'audio' || callMode === 'video') && (
                  <button
                    onClick={stopCall}
                    className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    title="End Call"
                  >
                    {callMode === 'audio' ? (
                      <PhoneOff className="w-5 h-5" />
                    ) : (
                      <VideoOff className="w-5 h-5" />
                    )}
                  </button>
                )}
                {(consultation.isComplete || consultation.medicalReceipt) && (
                  <button
                    onClick={() => setIsSummaryModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    View Summary / Download
                  </button>
                )}
                <button
                  onClick={stopConsultation}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  End Consultation
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Call View (when active) */}
          {callMode === 'video' && (
            <div className="h-64 bg-black flex items-center justify-center relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-32 h-24 rounded-lg border-2 border-white object-cover"
              />
            </div>
          )}

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-white"
          >
            {consultation.messages.length === 0 && !consultation.isActive && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Start Your Consultation
                </h2>
                <p className="text-gray-500 max-w-md">
                  Click "Start Consultation" to begin a real-time conversation with our AI doctor.
                  The AI will ask follow-up questions to better understand your condition.
                </p>
              </div>
            )}

            {consultation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.isFollowUp
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.isFollowUp && (
                    <p className="text-xs mt-1 opacity-75">Follow-up question</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {consultation.isActive && (
            <div className="border-t border-gray-200 bg-white p-4">
              {/* Language Selection */}
              <div className="mb-2 flex items-center gap-2">
                <label className="text-xs text-gray-600">Language:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'am' | 'ti')}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                  disabled={isRecording}
                >
                  <option value="en">English</option>
                  <option value="am">Amharic (አማርኛ)</option>
                  <option value="ti">Tigrinya (ትግርኛ)</option>
                </select>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Stop Speaking
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message or use voice input..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading || isRecording}
                />
                <button
                  onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {consultation.isComplete && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Consultation complete! You can download your medical receipt above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary & Download Modal */}
      {isSummaryModalOpen && consultation.medicalReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Medical Consultation Summary
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Review the AI doctor&apos;s clinical summary and download it in your preferred format.
                </p>
              </div>
              <button
                onClick={handleCloseSummaryAndEnd}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close summary"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-800">Session ID:</span>{' '}
                  <span>{consultation.medicalReceipt.sessionId}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Date:</span>{' '}
                  <span>
                    {new Date(consultation.medicalReceipt.date).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Urgency:</span>{' '}
                  <span className="uppercase">
                    {consultation.medicalReceipt.urgency}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Clinical Summary
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap border border-gray-100 rounded-md p-3 bg-gray-50">
                  {consultation.medicalReceipt.summary || 'No summary available.'}
                </p>
              </div>

              {consultation.medicalReceipt.recommendations &&
                consultation.medicalReceipt.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Recommendations &amp; Plan
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 border border-gray-100 rounded-md p-3 bg-gray-50">
                      {consultation.medicalReceipt.recommendations.map(
                        (rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              <p className="text-xs text-gray-500">
                This AI-generated consultation summary is for informational purposes only and
                does not replace professional medical advice, diagnosis, or treatment.
              </p>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-gray-500">
                Choose a format to download your summary for later review or sharing with a
                healthcare professional.
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => downloadMedicalReceipt('pdf')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
                <button
                  onClick={() => downloadMedicalReceipt('txt')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  TXT
                </button>
                <button
                  onClick={() => downloadMedicalReceipt('json')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

