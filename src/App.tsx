import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import NameInput from './pages/NameInput';
import RecordForm from './pages/RecordForm';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#E1306C' },
    secondary: { main: '#405DE6' },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: 10,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.95rem',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NameInput />} />
          <Route path="/record" element={<RecordForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
