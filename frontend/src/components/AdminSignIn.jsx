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

export default function AdminLogin(props) {

    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const { adminLogin, token } = useAuth();
    const navigate = useNavigate();

    let [formData, setFormData] = React.useState({
        email: '',
        password: ''
    })


    // Validate using component state so we can get a synchronous boolean result
    const validateInputs = () => {
        const emailVal = formData.email?.trim();
        const passVal = formData.password?.trim();

        let isValid = true;

        if (!emailVal || !/\S+@\S+\.\S+/.test(emailVal)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage('');
        }

        if (!passVal) {
            setPasswordError(true);
            setPasswordErrorMessage('Enter a valid Password Number');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        return isValid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        console.log("Form submit triggered ");
        // use state-based validation so result is available immediately
        const isValid = validateInputs();

        console.log(isValid);
        if (!isValid) return;

        try {
            console.log(formData.email, formData.password);
            const res = await adminLogin(formData.email, formData.password);

            // login() returns an object on failure, undefined on success in the current context implementation
            if (res && res.success === false) {
                toast.error(res.message || 'Login failed. Please check your credentials.', { autoClose: 3000 });
                return;
            }

            console.log("Login Successful");
            toast.success("Login Successful!", { autoClose: 3000 });
            navigate("/admin/dashboard");

        } catch (err) {
            // if login ever throws, handle it here
            console.log("login failed : ", err?.message || err);
            toast.error("Login failed. Please check your credentials.", { autoClose: 3000 });
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
                        <FormControl>
                            <FormLabel htmlFor="password" ><b>Password</b></FormLabel>
                            <TextField
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                name="password"
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                autoComplete="current-password"
                                placeholder="password"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={passwordError ? 'error' : 'primary'}
                            />
                        </FormControl>

                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className='bg-blue-700 p-4 rounded text-white font-bold'
                        >
                            Log in
                        </button>

                    </Box>
                </Card>
            </SignInContainer>
        </div >
    );
}