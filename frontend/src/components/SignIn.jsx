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
import {
    Select,
    MenuItem,
} from '@mui/material'
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
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { login, token } = useAuth();
    const navigate = useNavigate();

    let [formData, setFormData] = React.useState({
        email: ''
    })

    const [year, setYear] = React.useState(0);



    function encodeYear(year) {
        return btoa(year.toString());
    }


    // Validate using component state so we can get a synchronous boolean result
    const validateInputs = () => {
        const emailVal = formData.email?.trim();

        let isValid = true;

        if (!emailVal || !/\S+@\S+\.\S+/.test(emailVal)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage('');
        }

        if (!year) {
            // keep year validation simple (you can surface a UI error if desired)
            isValid = false;
        }

        return isValid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const isValid = validateInputs();
        if (!isValid) return;

        setLoading(true);
        try {
            const res = await login(formData.email, year);

            if (res && res.success === false) {
                toast.error(res.message || 'Login failed. Please check your credentials.', { autoClose: 3000 });
                return;
            }

            toast.success("Login Successful!", { autoClose: 3000 });
            navigate(`/quiz/instructions/${encodeYear(year)}`);

        } catch (err) {
            console.log("login failed : ", err?.message || err);
            toast.error("Login failed. Please check your credentials.", { autoClose: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (event) => {
        setFormData((prev) => {
            prev[event.target.name] = event.target.value;
            return {
                ...prev
            }
        })
    }



    return (
        <div {...props}>
            <CssBaseline enableColorScheme />
            <SignInContainer direction="column" justifyContent="space-between">

                <div sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <Card variant="outlined">
                    <img
                        src={codexLogo}
                        className='h-10 w-40 mb-4'
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
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="your@email.com"
                                autoComplete="email"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={emailError ? 'error' : 'primary'}
                            />
                        </FormControl>

                        <FormControl fullWidth>
                            <FormLabel htmlFor="year"><b>Year</b></FormLabel>
                            <Select
                                id="year"
                                name="year"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                displayEmpty
                                required
                            >
                                <MenuItem value="" disabled>Select your year</MenuItem>
                                <MenuItem value={1}>1st Year</MenuItem>
                                <MenuItem value={2}>2nd Year</MenuItem>
                            </Select>
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
        </div >
    );
}