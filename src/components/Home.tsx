import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
Box,
Container,
Typography,
Button,
Stack,
Paper,
} from '@mui/material';

export default function Home() {
const navigate = useNavigate();

return (
    <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
    >
        <Container maxWidth="sm">
            <Stack spacing={4} sx={{ textAlign: 'center' }}>
                <Typography variant="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Welcome
                </Typography>

                <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Get started with your journey. Explore features and create your account.
                </Typography>

                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    }}
                >
                    <Stack spacing={2}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/login')}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/signup')}
                        >
                            Create Account
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    </Box>
);
}