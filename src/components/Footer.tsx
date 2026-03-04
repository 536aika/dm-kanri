import { Box, Typography } from '@mui/material';

const DAILY_LIMIT = 150;
const REWARD = '¥5,000';

interface FooterProps {
  todayCount: number;
}

export default function Footer({ todayCount }: FooterProps) {
  const remaining = Math.max(0, DAILY_LIMIT - todayCount);

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        py: 2,
        px: 2,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="body1" fontWeight="bold">
        報酬：{REWARD}
      </Typography>
      <Typography variant="body1" color="primary.main">
        ¥5,000までの残り：{remaining}件
      </Typography>
    </Box>
  );
}
