import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx"
import QuizPage from "./pages/QuizPage.jsx"

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/quiz/:year",
        element: <QuizPage />
    }
])

export default router;