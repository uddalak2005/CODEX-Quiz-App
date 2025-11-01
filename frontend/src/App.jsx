import './App.css'
import SignIn from './components/SignIn';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.title = "Login | Codex";
  }, []);
  return (
    <>
      <SignIn />
    </>
  )
}

export default App;