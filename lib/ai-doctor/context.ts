// Shared conversation context storage for AI Doctor consultations
// In production, this should use Redis or a database

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface MedicalReceipt {
  sessionId: string;
  date: string;
  summary: string;
  diagnosis?: string;
  recommendations: string[];
  prescriptions?: string[];
  urgency: 'low' | 'medium' | 'high';
  conversationHistory?: ConversationMessage[];
}

// In-memory storage (replace with Redis/database in production)
export const conversationContexts = new Map<string, ConversationMessage[]>();
export const receiptStore = new Map<string, MedicalReceipt>();

export function storeReceipt(sessionId: string, receiptData: MedicalReceipt) {
  receiptStore.set(sessionId, receiptData);
}

export function getReceipt(sessionId: string): MedicalReceipt | undefined {
  return receiptStore.get(sessionId);
}

export function clearContext(sessionId: string) {
  conversationContexts.delete(sessionId);
  // Don't delete receipt - user may want to download it after ending consultation
  // receiptStore.delete(sessionId);
}

export function clearReceipt(sessionId: string) {
  receiptStore.delete(sessionId);
}

