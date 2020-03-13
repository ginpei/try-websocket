export type ChatUser = {
  id: string;
  name: string;
}

export type ChatRoom<T extends ChatUser = ChatUser> = {
  id: string;
  users: T[];
}

export type ChatMessage = {
  body: string;
  userId: string;
  name: string;
  date: number;
  id: string;
}

export type ChatMessageRequest = Pick<ChatMessage, 'body'>
