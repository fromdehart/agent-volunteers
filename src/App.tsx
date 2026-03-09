import { ConvexProvider } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { convex } from "./lib/convexClient";
import Index from "./pages/Index";
import Register from "./pages/Register";
import OpportunityDetail from "./pages/OpportunityDetail";
import AgentGuide from "./pages/AgentGuide";

const App = () => {
  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/opportunities/:id" element={<OpportunityDetail />} />
          <Route path="/guide" element={<AgentGuide />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  );
};

export default App;
