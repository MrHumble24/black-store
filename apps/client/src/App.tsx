import Providers from "./app/providers/Providers";
import AppRoutes from "./app/router/AppRoutes";
import "./index.css";

function App() {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  );
}

export default App;
