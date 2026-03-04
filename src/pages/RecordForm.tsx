import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  addDmRecord,
  subscribeTodayCount,
} from '../firebase';
import {
  BUSINESS_TYPES,
  FOLLOWER_RANGES,
  type DmRecordForm,
  type BusinessType,
  type FollowerRange,
} from '../types';
import { todayJST, monthJST, nowISOJST } from '../lib/jst';
import { isValidAccountLink, normalizeAccountLink } from '../lib/validation';
import {
  shouldStartBreak,
  isBreakActive,
  getRemainingMs,
  formatRemaining,
  setBreakLock,
  clearBreakLock,
} from '../lib/breakTime';
import Footer from '../components/Footer';
import BreakTimeOverlay from '../components/BreakTimeOverlay';

const DAILY_LIMIT = 150;

const initialForm: DmRecordForm = {
  userName: '',
  accountLink: '',
  businessType: '',
  followerRange: '',
  hasChampagne: false,
  hasChampagneTower: false,
};

export default function RecordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = (location.state as { userName?: string } | null)?.userName ?? '';

  const [form, setForm] = useState<DmRecordForm>({ ...initialForm, userName });
  const [todayCount, setTodayCount] = useState(0);
  const [breakEndRemaining, setBreakEndRemaining] = useState(0);
  const [snackOpen, setSnackOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userName) {
      navigate('/', { replace: true });
      return;
    }
    setForm((f) => ({ ...f, userName }));
  }, [userName, navigate]);

  useEffect(() => {
    return subscribeTodayCount(setTodayCount);
  }, []);

  const breakActive = isBreakActive();
  const remainingFormatted = formatRemaining(breakEndRemaining);

  useEffect(() => {
    if (!breakActive) {
      setBreakEndRemaining(0);
      return;
    }
    const tick = () => {
      const ms = getRemainingMs();
      setBreakEndRemaining(ms);
      if (ms <= 0) clearBreakLock();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [breakActive]);

  const canSubmit =
    form.userName.trim() !== '' &&
    isValidAccountLink(form.accountLink) &&
    form.businessType !== '' &&
    form.followerRange !== '' &&
    !breakActive &&
    todayCount < DAILY_LIMIT &&
    !submitting;

  const atLimit = todayCount >= DAILY_LIMIT;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const link = normalizeAccountLink(form.accountLink);
      const payload: DmRecordForm = {
        ...form,
        accountLink: link,
      };
      await addDmRecord(payload);
      const newCount = todayCount + 1;
      if (shouldStartBreak(newCount)) {
        setBreakLock();
      }
      try {
        await fetch('/api/sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: payload.userName,
            accountLink: payload.accountLink,
            businessType: payload.businessType,
            followerRange: payload.followerRange,
            hasChampagne: payload.hasChampagne,
            hasChampagneTower: payload.hasChampagneTower,
            sentAt: nowISOJST(),
            date: todayJST(),
            month: monthJST(),
          }),
        });
      } catch {
        // Sheet sync failure is non-blocking
      }
      setForm({ ...initialForm, userName: form.userName });
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, form, todayCount]);

  const handleLogout = () => {
    navigate('/', { replace: true });
  };

  if (!userName) return null;

  return (
    <>
      <Box sx={{ pb: 12 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {userName}
          </Typography>
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            size="small"
            color="inherit"
          >
            ログアウト
          </Button>
        </Box>

        <Container maxWidth="sm" sx={{ py: 3 }}>
          <TextField
            label="アカウントリンク"
            value={form.accountLink}
            onChange={(e) => setForm((f) => ({ ...f, accountLink: e.target.value }))}
            fullWidth
            required
            placeholder="https://instagram.com/..."
            error={form.accountLink.length > 0 && !isValidAccountLink(form.accountLink)}
            helperText={
              form.accountLink.length > 0 && !isValidAccountLink(form.accountLink)
                ? 'instagram.com を含むURLを入力してください'
                : undefined
            }
            sx={{ mb: 2 }}
          />

          <FormControl component="fieldset" required sx={{ mb: 2, display: 'block' }}>
            <FormLabel component="legend">業態</FormLabel>
            <RadioGroup
              value={form.businessType}
              onChange={(_, v) => setForm((f) => ({ ...f, businessType: v as BusinessType }))}
              sx={{ flexWrap: 'wrap', flexDirection: 'row' }}
            >
              {BUSINESS_TYPES.map((opt) => (
                <FormControlLabel
                  key={opt}
                  value={opt}
                  control={<Radio size="small" />}
                  label={opt}
                  labelPlacement="end"
                  sx={{ mr: 1, mb: 0.5 }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset" required sx={{ mb: 2, display: 'block' }}>
            <FormLabel component="legend">フォロワー数</FormLabel>
            <RadioGroup
              value={form.followerRange}
              onChange={(_, v) => setForm((f) => ({ ...f, followerRange: v as FollowerRange }))}
              sx={{ flexWrap: 'wrap', flexDirection: 'row' }}
            >
              {FOLLOWER_RANGES.map((opt) => (
                <FormControlLabel
                  key={opt}
                  value={opt}
                  control={<Radio size="small" />}
                  label={opt}
                  labelPlacement="end"
                  sx={{ mr: 1, mb: 0.5 }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={form.hasChampagne}
                onChange={(_, c) => setForm((f) => ({ ...f, hasChampagne: c }))}
              />
            }
            label="シャンパン投稿あり"
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.hasChampagneTower}
                onChange={(_, c) => setForm((f) => ({ ...f, hasChampagneTower: c }))}
              />
            }
            label="シャンパンタワー投稿あり"
            sx={{ mb: 2 }}
          />

          {atLimit && (
            <Typography color="error" sx={{ mb: 2 }}>
              本日の送信上限に達しました
            </Typography>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!canSubmit}
            onClick={handleSubmit}
            sx={{ py: 1.5 }}
          >
            送信
          </Button>
        </Container>
      </Box>

      <Footer todayCount={todayCount} />

      {breakActive && <BreakTimeOverlay remainingFormatted={remainingFormatted} />}

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        message="送信しました✅"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
