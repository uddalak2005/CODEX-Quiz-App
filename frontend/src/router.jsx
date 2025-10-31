import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx"
import QuizPage from "./pages/QuizPage.jsx"
import InstructionPage from "./pages/IntructionPage.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/quiz/:year",
        element: <QuizPage />
    },
    {
        path: "/quiz/instructions/:year",
        element: <InstructionPage />
    }
])

export default router;