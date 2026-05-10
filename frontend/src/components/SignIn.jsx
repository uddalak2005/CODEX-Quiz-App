import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import codexLogo from '../assets/codex-logo.png';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from "react-toastify";
import InlineLoader from './Loader.jsx';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '450px',
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));

export default function SignIn(props) {
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = React.useState('');

    const validateInputs = () => {
        const val = email.trim();
        if (!val || !/\S+@\S+\.\S+/.test(val)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            return false;
        }
        setEmailError(false);
        setEmailErrorMessage('');
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateInputs()) return;

        setLoading(true);
        try {
            const res = await login(email.trim());

            if (!res.success) {
                toast.error(res.message || 'Login failed. Please check your credentials.', { autoClose: 3000 });
                return;
            }

            if (!res.assignedQuizId) {
                toast.error("No quiz has been assigned to your account yet. Please contact the admin.", { autoClose: 5000 });
                return;
            }

            toast.success("Login Successful!", { autoClose: 2000 });
            // Auto-redirect to the quiz assigned to this specific user
            navigate(`/quiz/instructions/${res.assignedQuizId}`);

        } catch (err) {
            toast.error("Login failed. Please try again.", { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div {...props}>
            <CssBaseline enableColorScheme />
            <SignInContainer direction="column" justifyContent="space-between">
                <div sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <Card variant="outlined">
                    <img
                        src={codexLogo}
                        className='h-10 w-40 mb-4'
                        alt="CODEX Logo"
                    />
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            gap: 2,
                        }}
                    >
                        <FormControl>
                            <FormLabel htmlFor="email"><b>Email</b></FormLabel>
                            <TextField
                                error={emailError}
                                helperText={emailErrorMessage}
                                id="email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                autoComplete="email"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={emailError ? 'error' : 'primary'}
                            />
                        </FormControl>

                        <button
                            type="submit"
                            disabled={loading}
                            className='bg-blue-700 p-4 rounded text-white font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'
                        >
                            {loading ? <InlineLoader size={20} color="#fff" /> : 'Sign in'}
                        </button>
                    </Box>
                </Card>
            </SignInContainer>
        </div>
    );
}