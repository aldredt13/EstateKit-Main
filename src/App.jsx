import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PitchVSL from "./pages/PitchVSL";
import NotFound from "./pages/NotFound";
import Thanks from "./pages/Thanks";
import PitchRES from "./pages/PitchRES";
import Webinar from "./pages/Webinar";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/webinar" element={<Webinar />} />
      <Route path="/pitch-vsl" element={<PitchVSL />} />
      <Route path="/pitch/res" element={<PitchRES />} />
      <Route path="/pitch" element={<PitchVSL />} />
      <Route path="/thank-you" element={<Thanks />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
