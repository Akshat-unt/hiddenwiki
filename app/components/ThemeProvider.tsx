'use client'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme } from '@mui/material/styles'
import { Toaster } from 'react-hot-toast'

// Create a Wikipedia-like theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3366cc', // Wikipedia blue
    },
    secondary: {
      main: '#54595d', // Wikipedia gray
    },
    background: {
      default: '#f6f6f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#202122',
      secondary: '#54595d',
    },
  },
  typography: {
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 400,
      borderBottom: '1px solid #a2a9b1',
      paddingBottom: '0.25em',
      marginBottom: '0.5em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      borderBottom: '1px solid #a2a9b1',
      paddingBottom: '0.25em',
      marginBottom: '0.5em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 400,
      borderBottom: '1px solid #a2a9b1',
      paddingBottom: '0.25em',
      marginBottom: '0.5em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#202122',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
  },
})

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      {children}
    </MuiThemeProvider>
  )
}
