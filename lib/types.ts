export type View = "feed" | "thread" | "rank" | "profile" | "admin";
export type SortMode = "Recientes" | "Populares";
export type VoteValue = -1 | 0 | 1;

export interface ChatMessage {
  me: boolean;
  text: string;
}

export interface Chat {
  id: number;
  alias: string;
  status: string;
  unread: boolean;
  msgs: ChatMessage[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  group?: "tema" | "carrera";
}

export interface BadgeInfo {
  label: string;
  color: string | null;
  textColor: string | null;
  effect: "blink" | "shift" | null;
}

export interface RankingUser {
  alias: string;
  meta: string;
  karma: number;
  badge: string;
}

export interface DecoratedPollOption {
  id: number;
  text: string;
  votes: number;
  pct: number;
}

export interface DecoratedPoll {
  options: DecoratedPollOption[];
  totalVotes: number;
  myVote: number | null;
}

export interface DecoratedPost {
  id: number;
  cat: string;
  author: string;
  time: string;
  title: string;
  excerpt: string;
  body: string;
  votes: number;
  commentCount: number;
  voteValue: VoteValue;
  likes: number;
  liked: boolean;
  pinned: boolean;
  reported: boolean;
  poll?: DecoratedPoll;
  isQuestion: boolean;
  bestAnswerId: number | null;
}

export interface DecoratedComment {
  id: number;
  author: string;
  time: string;
  text: string;
  likes: number;
  liked: boolean;
  reported: boolean;
  isBestAnswer: boolean;
}

export interface AppNotification {
  id: number;
  type: "vote" | "like" | "comment" | "commentLike";
  postId: number;
  commentId?: number;
  message: string;
  time: string;
  read: boolean;
}

export interface Report {
  id: number;
  kind: "post" | "comment";
  postId: number;
  commentId?: number;
  postTitle: string;
  author: string;
  snippet: string;
  reportedAt: string;
}
