import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import { DM_USER_NAME_KEY } from '../constants';

export default function NameInput() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      sessionStorage.setItem(DM_USER_NAME_KEY, trimmed);
    } catch {
      // シークレットモード等で sessionStorage が使えない場合は state のみ
    }
    navigate('/record', { state: { userName: trimmed } });
  };

  return (
    <Container maxWidth="sm" sx={{ pt: 4, pb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '60vh',
          justifyContent: 'center',
        }}
      >
        <CampaignIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Instagram DM送信管理
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          送信実績を記録して報酬管理
        </Typography>
        <TextField
          label="お名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={{ maxWidth: 320, mb: 2 }}
          placeholder="名前を入力"
          inputProps={{ 'aria-label': '名前' }}
        />
        <Button
          variant="contained"
          size="large"
          onClick={handleStart}
          disabled={!name.trim()}
          sx={{ minWidth: 200, py: 1.5 }}
        >
          はじめる
        </Button>
      </Box>
    </Container>
  );
}
