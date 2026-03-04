import { google } from 'googleapis';

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
  const key = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

export async function POST(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SheetPayload;
  try {
    body = (await request.json()) as SheetPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return new Response(JSON.stringify({ error: 'GOOGLE_SHEET_ID is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetTitle = body.month;

    const { data: spreadsheet } = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const sheetExists = spreadsheet.sheets?.some((s) => s.properties?.title === sheetTitle);

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

    const range = `'${sheetTitle}'!A:G`;
    const { data: existing } = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${sheetTitle}'!A1:G1`,
    });
    const values = existing.values;
    const hasHeader =
      values && values.length > 0 && values[0]?.[0] === SHEET_HEADERS[0];
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

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Sheet append failed', detail: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
