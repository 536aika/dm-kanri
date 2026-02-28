import { useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Toolbar,
  Typography,
  Checkbox,
  Snackbar,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material'
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { sendRecordToSheet } from './sheetSync'

type BusinessType =
  | '飲食店'
  | 'ホスト'
  | 'キャバクラ'
  | 'コンカフェ'
  | 'BAR'
  | 'スナック'
  | 'その他（男性業態）'
  | 'その他（女性業態）'
  | 'その他'

type FollowerRange = '〜100' | '〜500' | '〜1000' | '1001〜' | 'その他'

const BUSINESS_TYPES: BusinessType[] = [
  '飲食店',
  'ホスト',
  'キャバクラ',
  'コンカフェ',
  'BAR',
  'スナック',
  'その他（男性業態）',
  'その他（女性業態）',
  'その他',
]

const FOLLOWER_RANGES: FollowerRange[] = ['〜100', '〜500', '〜1000', '1001〜', 'その他']

const DAILY_LIMIT = 150
const BREAK_THRESHOLDS = [25, 50, 75, 100, 125]
const BREAK_DURATION_MS = 60 * 60 * 1000

const STORAGE_KEYS = {
  USER_NAME: 'dmAppUserName',
  BREAK_STATE: 'dmAppBreakState',
} as const

type BreakState = {
  lockedUntil: number
  date: string
}

function getJstNow() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 9 * 60 * 60 * 1000)
}

function formatJstDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const [userName, setUserName] = useState<string>('')
  const [loginInput, setLoginInput] = useState<string>('')

  const [accountLink, setAccountLink] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType | ''>('')
  const [followerRange, setFollowerRange] = useState<FollowerRange | ''>('')
  const [hasChampagne, setHasChampagne] = useState(false)
  const [hasChampagneTower, setHasChampagneTower] = useState(false)

  const [accountLinkError, setAccountLinkError] = useState<string | null>(null)
  const [businessTypeError, setBusinessTypeError] = useState<string | null>(null)
  const [followerRangeError, setFollowerRangeError] = useState<string | null>(null)

  const [todayCount, setTodayCount] = useState<number>(0)
  const [isSending, setIsSending] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const [breakState, setBreakState] = useState<BreakState | null>(null)
  const [now, setNow] = useState<Date>(getJstNow())

  const jstToday = useMemo(() => formatJstDate(now), [now])

  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME)
    if (storedName) {
      setUserName(storedName)
      setLoginInput(storedName)
    }

    const storedBreak = localStorage.getItem(STORAGE_KEYS.BREAK_STATE)
    if (storedBreak) {
      try {
        const parsed = JSON.parse(storedBreak) as BreakState
        if (parsed.date === formatJstDate(getJstNow()) && parsed.lockedUntil > Date.now()) {
          setBreakState(parsed)
        } else {
          localStorage.removeItem(STORAGE_KEYS.BREAK_STATE)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.BREAK_STATE)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getJstNow())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (breakState && breakState.lockedUntil <= Date.now()) {
      setBreakState(null)
      localStorage.removeItem(STORAGE_KEYS.BREAK_STATE)
    }
  }, [now, breakState])

  const isBreakActive = !!breakState && breakState.lockedUntil > Date.now()
  const remainingForReward = Math.max(DAILY_LIMIT - todayCount, 0)

  const remainingBreakMs = isBreakActive ? breakState!.lockedUntil - Date.now() : 0
  const remainingBreakText = useMemo(() => {
    if (!isBreakActive || remainingBreakMs <= 0) return ''
    const totalSeconds = Math.floor(remainingBreakMs / 1000)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }, [isBreakActive, remainingBreakMs])

  const isDailyLimitReached = todayCount >= DAILY_LIMIT

  const validateAccountLink = (value: string) => {
    if (!value) {
      setAccountLinkError('アカウントリンクを入力してください')
      return false
    }
    try {
      const url = new URL(value)
      if (!url.hostname.includes('instagram.com')) {
        setAccountLinkError('instagram.comを含むURLを入力してください')
        return false
      }
    } catch {
      setAccountLinkError('正しいURL形式で入力してください')
      return false
    }
    setAccountLinkError(null)
    return true
  }

  const handleLogin = () => {
    const trimmed = loginInput.trim()
    if (!trimmed) return
    setUserName(trimmed)
    localStorage.setItem(STORAGE_KEYS.USER_NAME, trimmed)
  }

  const handleLogout = () => {
    setUserName('')
    localStorage.removeItem(STORAGE_KEYS.USER_NAME)
  }

  const resetForm = () => {
    setAccountLink('')
    setBusinessType('')
    setFollowerRange('')
    setHasChampagne(false)
    setHasChampagneTower(false)
    setAccountLinkError(null)
    setBusinessTypeError(null)
    setFollowerRangeError(null)
  }

  const isFormValid =
    !!accountLink &&
    !accountLinkError &&
    !!businessType &&
    !!followerRange &&
    !businessTypeError &&
    !followerRangeError

  const handleSubmit = async () => {
    if (!userName || !isFormValid || isSending || isBreakActive || isDailyLimitReached) return

    const ok = validateAccountLink(accountLink)
    if (!ok) return
    if (!businessType) {
      setBusinessTypeError('業態を選択してください')
      return
    }
    if (!followerRange) {
      setFollowerRangeError('フォロワー数を選択してください')
      return
    }

    setIsSending(true)
    try {
      const jstNow = getJstNow()
      const date = formatJstDate(jstNow)
      const month = `${date.slice(0, 7)}`

      await addDoc(collection(db, 'dm_records'), {
        userName,
        accountLink: accountLink.trim(),
        businessType,
        followerRange,
        hasChampagne,
        hasChampagneTower,
        sentAt: Timestamp.fromDate(jstNow),
        date,
        month,
      })

      sendRecordToSheet({
        userName,
        accountLink: accountLink.trim(),
        businessType,
        followerRange,
        hasChampagne,
        hasChampagneTower,
        date,
        month,
        sentAt: jstNow.toISOString(),
      }).catch(() => {})

      const nextCount = todayCount + 1
      setTodayCount(nextCount)

      if (BREAK_THRESHOLDS.includes(nextCount)) {
        const lockedUntil = Date.now() + BREAK_DURATION_MS
        const newBreakState: BreakState = {
          lockedUntil,
          date: jstToday,
        }
        setBreakState(newBreakState)
        localStorage.setItem(STORAGE_KEYS.BREAK_STATE, JSON.stringify(newBreakState))
      }

      resetForm()
      setSnackbarOpen(true)
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    const fetchTodayCount = async () => {
      if (!userName) return
      try {
        const jstNow = getJstNow()
        const date = formatJstDate(jstNow)
        const q = query(
          collection(db, 'dm_records'),
          where('userName', '==', userName),
          where('date', '==', date),
          orderBy('sentAt', 'asc'),
        )
        const snapshot = await getDocs(q)
        setTodayCount(snapshot.size)
      } catch (e) {
        console.error(e)
      }
    }
    fetchTodayCount()
  }, [userName])

  if (!userName) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f5f7 0%, #e0f2ff 100%)',
          px: 2,
        }}
      >
        <Container maxWidth="xs">
          <Card
            elevation={8}
            sx={{
              borderRadius: 4,
              backdropFilter: 'blur(12px)',
            }}
          >
            <CardContent sx={{ py: 4 }}>
              <Box textAlign="center" mb={3}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  Instagram DM送信管理
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  お名前を入力して、DM送信をスタートしましょう。
                </Typography>
              </Box>
              <Stack spacing={2.5}>
                <TextField
                  label="お名前"
                  fullWidth
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  autoFocus
                  variant="outlined"
                  inputProps={{ maxLength: 50 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={!loginInput.trim()}
                  onClick={handleLogin}
                  sx={{
                    py: 1.4,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 999,
                  }}
                >
                  ログイン
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: 10,
        backgroundColor: 'background.default',
      }}
    >
      <AppBar position="sticky" elevation={1} color="inherit">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              ログイン中
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {userName}
            </Typography>
          </Box>
          <Button
            color="inherit"
            size="small"
            onClick={handleLogout}
            sx={{ textTransform: 'none' }}
          >
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2.5 }}>
        <Stack spacing={2.5}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  本日の送信数
                </Typography>
                <Chip
                  label={`${todayCount} / ${DAILY_LIMIT} 件`}
                  color={isDailyLimitReached ? 'error' : 'primary'}
                  variant={isDailyLimitReached ? 'filled' : 'outlined'}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                0:00（日本時間）に自動リセットされます。
              </Typography>
            </CardContent>
          </Card>

          {isBreakActive && (
            <Card
              elevation={4}
              sx={{
                borderLeft: (theme) => `4px solid ${theme.palette.secondary.main}`,
                background:
                  'linear-gradient(120deg, rgba(245,0,87,0.06) 0%, rgba(25,118,210,0.03) 90%)',
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Break Time 🕐
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, letterSpacing: 4, mb: 1 }}
                  color="text.primary"
                >
                  {remainingBreakText}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  休憩中はDM送信がロックされます。カウントが0になると自動で再開します。
                </Typography>
              </CardContent>
            </Card>
          )}

          <Card
            elevation={3}
            sx={{
              opacity: isDailyLimitReached ? 0.6 : 1,
            }}
          >
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="アカウントリンク（instagram.com）"
                  fullWidth
                  placeholder="https://www.instagram.com/..."
                  value={accountLink}
                  onChange={(e) => {
                    const value = e.target.value
                    setAccountLink(value)
                    if (accountLinkError) {
                      validateAccountLink(value)
                    }
                  }}
                  error={!!accountLinkError}
                  helperText={accountLinkError || 'instagram.comを含むURLを入力してください。'}
                  InputProps={{
                    sx: { borderRadius: 3 },
                  }}
                />

                <FormControl error={!!businessTypeError}>
                  <FormLabel>業態</FormLabel>
                  <RadioGroup
                    value={businessType}
                    onChange={(e) => {
                      setBusinessType(e.target.value as BusinessType)
                      setBusinessTypeError(null)
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        rowGap: 0,
                      }}
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <FormControlLabel
                          key={type}
                          value={type}
                          control={<Radio size="small" />}
                          label={type}
                        />
                      ))}
                    </Box>
                  </RadioGroup>
                  {businessTypeError && <FormHelperText>{businessTypeError}</FormHelperText>}
                </FormControl>

                <FormControl error={!!followerRangeError}>
                  <FormLabel>フォロワー数</FormLabel>
                  <RadioGroup
                    row
                    value={followerRange}
                    onChange={(e) => {
                      setFollowerRange(e.target.value as FollowerRange)
                      setFollowerRangeError(null)
                    }}
                  >
                    {FOLLOWER_RANGES.map((range) => (
                      <FormControlLabel
                        key={range}
                        value={range}
                        control={<Radio size="small" />}
                        label={range}
                      />
                    ))}
                  </RadioGroup>
                  {followerRangeError && <FormHelperText>{followerRangeError}</FormHelperText>}
                </FormControl>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    任意項目
                  </Typography>
                  <Stack spacing={0.5}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hasChampagne}
                          onChange={(e) => setHasChampagne(e.target.checked)}
                        />
                      }
                      label="シャンパン投稿あり"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hasChampagneTower}
                          onChange={(e) => setHasChampagneTower(e.target.checked)}
                        />
                      }
                      label="シャンパンタワー投稿あり"
                    />
                  </Stack>
                </Box>

                {isDailyLimitReached && (
                  <Alert severity="info">
                    本日の送信上限に達しました。明日0:00（日本時間）以降に再開できます。
                  </Alert>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={!isFormValid || isSending || isBreakActive || isDailyLimitReached}
                  onClick={handleSubmit}
                  sx={{
                    py: 1.6,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                >
                  DM送信を記録する
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper',
          py: 1.2,
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                報酬：¥5,000
              </Typography>
              <Typography variant="caption" color="text.secondary">
                単価 ¥35 / 1DM・1日上限 {DAILY_LIMIT} 件
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">
                ¥5,000までの残り
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {remainingForReward} 件
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          送信しました✅
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App
