import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

/**
 * FullScreenLoader – covers the whole viewport with a semi-transparent
 * overlay and a centred spinner. Use it for page-level loading states.
 */
export function FullScreenLoader() {
    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
            }}
        >
            <CircularProgress size={52} thickness={4} />
        </Box>
    );
}

/**
 * InlineLoader – a small spinner for use inside buttons or inline elements.
 */
export default function InlineLoader({ size = 22, color = '#fff' }) {
    return (
        <CircularProgress
            size={size}
            thickness={5}
            sx={{ color }}
        />
    );
}