import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert, Slide, Typography } from '@mui/material';

// Create context
const SnackbarContext = createContext({ showSnackbar: () => {} });

function SlideUp(props) {
  return <Slide {...props} direction="up" />;
}

// Provider component
const Provider = ({ children }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState({
    message: '',
    severity: 'info', // drives icon + accent colour
  });

  const handleSnackbarClose = useCallback((_event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const showSnackbar = useCallback((messageObj) => {
    setSnackbarMessage(messageObj);
    setSnackbarOpen(true);
  }, []);

  // Give people longer to read problems than confirmations.
  const autoHideDuration = useMemo(() => {
    const s = snackbarMessage.severity;
    return s === 'error' || s === 'warning' ? 4500 : 2800;
  }, [snackbarMessage.severity]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={autoHideDuration}
        onClose={handleSnackbarClose}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        TransitionComponent={SlideUp}
        sx={{ zIndex: 13000000, mb: { xs: 1, sm: 2 } }}
      >
        <Alert
          severity={snackbarMessage.severity}
          onClose={handleSnackbarClose}
          sx={{
            minWidth: { xs: 'auto', sm: 320 },
            maxWidth: 'min(92vw, 480px)',
            px: 2,
            py: 1,
            alignItems: 'center',
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.35 }}>
            {snackbarMessage.message}
          </Typography>
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Export provider and hook
export const SnackbarProvider = ({ children }) => <Provider>{children}</Provider>;
export const useSnackbar = () => useContext(SnackbarContext);
