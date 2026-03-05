import { google } from 'googleapis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SHEET_HEADERS = [
      '送信日時',
      'スタッフ名',
      'アカウントリンク',
      '業態',
      'フォロワー数',
      'シャンパン投稿',
      'シャンパンタワー投稿',
    ];

interface SheetPayload {
      userName: string;
      accountLink: string;
      businessType: string;
      followerRange: string;
      hasChampagne: boolean;
      hasChampagneTower: boolean;
      sentAt: string;
      date: string;
      month: string;
}

function getAuth() {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');

  // リテラル改行・エスケープ済み \n の両方に対応してからパース
  const cleaned = raw
        .replace(/\r\n/g, '\\n')   // Windows改行
    .replace(/\r/g, '\\n')     // CR
    .replace(/\n/g, '\\n');    // LF（リテラル改行）

  const key = JSON.parse(cleaned);

  // private_key 内の \\n を実際の改行に戻す
  if (key.private_key) {
          key.private_key = key.private_key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.GoogleAuth({
          credentials: key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
      return auth;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
      if (req.method !== 'POST') {
              return res.status(405).json({ error: 'Method not allowed' });
      }

  const body = req.body as SheetPayload;

  if (!body) {
          return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
      if (!sheetId) {
              return res.status(500).json({ error: 'GOOGLE_SHEET_ID is not set' });
      }

  try {
          const auth = getAuth();
          const sheets = google.sheets({ version: 'v4', auth });

        const sheetTitle = body.month;

        const { data: spreadsheet } = await sheets.spreadsheets.get({
                  spreadsheetId: sheetId,
        });

        const sheetExists = spreadsheet.sheets?.some(
                  (s) => s.properties?.title === sheetTitle
                );

        if (!sheetExists) {
                  await sheets.spreadsheets.batchUpdate({
                              spreadsheetId: sheetId,
                              requestBody: {
                                            requests: [
                                                {
                                                                  addSheet: {
                                                                                      properties: {
                                                                                                            title: sheetTitle,
                                                                                          },
                                                                  },
                                                },
                                                          ],
                              },
                  });
        }

        const row = [
                  body.sentAt,
                  body.userName,
                  body.accountLink,
                  body.businessType,
                  body.followerRange,
                  body.hasChampagne ? 'あり' : 'なし',
                  body.hasChampagneTower ? 'あり' : 'なし',
                ];

        let hasHeader = false;
          try {
                    const { data: existing } = await sheets.spreadsheets.values.get({
                                spreadsheetId: sheetId,
                                range: `'${sheetTitle}'!A1:G1`,
                    });
                    const values = existing.values;
                    hasHeader =
                                !!values && values.length > 0 && values[0]?.[0] === SHEET_HEADERS[0];
          } catch {
                    // シートが空または取得失敗時はヘッダーなしとして追記
          }

        const appendRows = hasHeader ? [row] : [SHEET_HEADERS, row];

        await sheets.spreadsheets.values.append({
                  spreadsheetId: sheetId,
                  range: `'${sheetTitle}'!A:G`,
                  valueInputOption: 'USER_ENTERED',
                  insertDataOption: 'INSERT_ROWS',
                  requestBody: {
                              values: appendRows,
                  },
        });

        return res.status(200).json({ ok: true });
  } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('Sheet append failed:', message);
          return res.status(500).json({ error: 'Sheet append failed', detail: message });
  }
}
