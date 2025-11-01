import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import InstructionPage from "./pages/IntructionPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import QuizDetails from "./pages/QuizDetails.jsx";
import AddQuiz from "./pages/AddQuiz.jsx";
import { UserProtectedRoute, AdminProtectedRoute } from "./components/ProtectedRoute.jsx";
import ErrorPage from "./pages/Error.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/quiz/:year",
        element: (
            <UserProtectedRoute>
                <QuizPage />
            </UserProtectedRoute>
        ),
    },
    {
        path: "/quiz/instructions/:year",
        element: (
            <UserProtectedRoute>
                <InstructionPage />
            </UserProtectedRoute>
        ),
    },
    {
        path: "/admin/logIn",
        element: <AdminPage />,
    },
    {
        path: "/admin/dashboard",
        element: (
            <AdminProtectedRoute>
                <AdminDashboard />
            </AdminProtectedRoute>
        ),
    },
    {
        path: "/admin/quiz/:quizId",
        element: (
            <AdminProtectedRoute>
                <QuizDetails />
            </AdminProtectedRoute>
        ),
    },
    {
        path: "/admin/addQuiz",
        element: (
            <AdminProtectedRoute>
                <AddQuiz />
            </AdminProtectedRoute>
        ),
    },
    {
        path: "*",
        element: <ErrorPage />

    }
]);

export default router;
