/**
 * 送信1件ごとにGoogle Apps ScriptのWebアプリへPOSTし、
 * スプレッドシートに月毎に蓄積する（無料・管理画面不要）
 */

export type SheetRecordPayload = {
  userName: string
  accountLink: string
  businessType: string
  followerRange: string
  hasChampagne: boolean
  hasChampagneTower: boolean
  date: string
  month: string
  sentAt: string
}

const URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL as string | undefined
const SECRET = import.meta.env.VITE_SHEET_SECRET as string | undefined

export function isSheetSyncConfigured(): boolean {
  return Boolean(URL && URL.trim())
}

/**
 * 1件のDM記録をスプレッドシート用Webアプリに送信（非同期・失敗しても握りつぶす）
 * フォーム送信にしてプリフライトを避け、無料のApps Scriptで受信可能にしている
 */
export async function sendRecordToSheet(payload: SheetRecordPayload): Promise<void> {
  if (!URL?.trim()) return

  const body: Record<string, unknown> = {
    ...payload,
    secret: SECRET ?? '',
  }

  try {
    const form = new URLSearchParams()
    form.set('data', JSON.stringify(body))
    await fetch(URL.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
  } catch {
    // ネットワークエラー等は無視（Firestoreが正なので）
  }
}
