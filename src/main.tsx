
  import { createBrowserRouter, RouterProvider } from "react-router";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AppToaster } from "./app/components/AppToaster.tsx";
  import { AuthProvider } from "./app/context/AuthContext.tsx";
  import "./styles/index.css";

  const router = createBrowserRouter([
    {
      path: "*",
      element: (
      <AuthProvider>
        <App />
        <AppToaster />
      </AuthProvider>
      ),
    },
  ]);

  createRoot(document.getElementById("root")!).render(
    <RouterProvider router={router} />
  );
