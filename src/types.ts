export const BUSINESS_TYPES = [
  '飲食店',
  'ホスト',
  'キャバクラ',
  'コンカフェ',
  'BAR',
  'スナック',
  'その他（男性業態）',
  'その他（女性業態）',
  'その他',
] as const;

export const FOLLOWER_RANGES = [
  '〜100',
  '〜500',
  '〜1000',
  '1001〜',
  'その他',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type FollowerRange = (typeof FOLLOWER_RANGES)[number];

export interface DmRecordForm {
  userName: string;
  accountLink: string;
  businessType: BusinessType | '';
  followerRange: FollowerRange | '';
  hasChampagne: boolean;
  hasChampagneTower: boolean;
}

export interface DmRecordPayload extends Omit<DmRecordForm, 'businessType' | 'followerRange'> {
  businessType: string;
  followerRange: string;
  sentAt: string; // ISO
  date: string;   // YYYY-MM-DD JST
  month: string;  // YYYY-MM
}
