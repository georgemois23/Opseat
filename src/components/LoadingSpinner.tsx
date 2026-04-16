import React, { useEffect, useState, FC } from 'react';
import { CircularProgress, Box, CircularProgressProps, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
// Ensure your build tool supports this import style (e.g., svgr)
// import { ReactComponent as Logo } from '.././assets/logos/opseatRed.svg';
// import { ReactComponent as Logo } from '.././assets/logos/opseat.svg';
import opseat from '.././assets/logos/opseat.svg';

interface LoadingSpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** MUI color palette shorthand or hex string */
  color?: CircularProgressProps['color'];
  /** Optional text to display below the spinner */
  message?: string;
  /** Whether to cover the entire viewport or just the parent container */
  fullscreen?: boolean;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 910;
const defaultSize = isMobile ? 190 : 150;

const SHOW_DELAY_MS = 250;

const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = defaultSize,
  color,
  message,
  fullscreen = true,
}) => {
  const theme = useTheme();
  const spinnerColor = color ?? alpha(theme.palette.secondary.main, 0.95);
  const [visible, setVisible] = useState<boolean>(false);

  // Delay showing to avoid flicker on fast loads
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Lock scroll only when fullscreen AND actually visible
  useEffect(() => {
    if (!fullscreen || !visible) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = prev || 'unset';
    };
  }, [fullscreen, visible]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: fullscreen ? 'fixed' : 'absolute',
        inset: 0,
        width: fullscreen ? '100vw' : '100%',
        height: fullscreen ? '100vh' : '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        backdropFilter: 'blur(50px)',
        WebkitBackdropFilter: 'blur(50px)',
        zIndex: fullscreen ? 9999 : 1,
        touchAction: fullscreen ? 'none' : 'auto',
        opacity: 0,
        animation: 'fadeIn 0.3s forwards',
        '@keyframes fadeIn': { to: { opacity: 1 } },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={size}
          color="inherit"
          thickness={size / 200}
          sx={{ position: 'absolute', color: spinnerColor }}
        />
        {/* <Logo
          style={{
            width: size * 0.6,
            height: size * 0.6,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        /> */}
        <Box
        component="img"
        src={opseat}
        alt="Opseat Logo"
        draggable={false}
        sx={{ 
            width: size * 0.6,
            height: size * 0.6,
      }}
      
      />
      </Box>

      {message && (
        <Box
          sx={{
            marginTop: 6,
            fontSize: isMobile ? '1rem' : '1.2rem',
            textAlign: 'center',
            color: 'text.primary',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontWeight: 500,
            maxWidth: '80%',
          }}
        >
          {message}
          <Box
            component="span"
            sx={{
              opacity: 0,
              animation: 'slowFade 2.5s forwards infinite',
              '@keyframes slowFade': { to: { opacity: 1 } },
            }}
          >
            ...
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LoadingSpinner;