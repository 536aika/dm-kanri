import { Box, Typography } from '@mui/material';

interface BreakTimeOverlayProps {
  remainingFormatted: string;
}

export default function BreakTimeOverlay({ remainingFormatted }: BreakTimeOverlayProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
    >
      <Typography variant="h3" component="p" sx={{ color: 'white', mb: 2 }}>
        Break Time 🕐
      </Typography>
      <Typography variant="h4" component="p" sx={{ color: 'primary.light', fontFamily: 'monospace' }}>
        {remainingFormatted}
      </Typography>
    </Box>
  );
}
