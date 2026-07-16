import { useEffect } from "react";
import Router from "./router/Router";
import useAuthStore from "./stores/useAuthStore";
import { Toaster } from "sonner";

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <>
      <Router />
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
