export interface Member {
  memberId: number;
  lastReadMessageId: number;
  name: string;
  avatarKey: string;
  avatarVersion: number;
  avatarUrl?: string; // 선택적으로 통일
  roomRole: "LEADER" | string;
}

export interface Room {
  id: string;
  name: string;
  lastChat: string;
  unreadCount?: number;
  memberCount?: number;
  members?: Member[];
  type?: "BASIC" | "STANDARD" | "ELITE" | "DEMO";
  role?: "LEADER" | "MEMBER";
  roomImageUrl?: string;
}
