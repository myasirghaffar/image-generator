export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ImageStudioMessage {
  id: string;
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  originalImageUrl?: string;
}