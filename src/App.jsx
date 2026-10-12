import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PitchVSL from "./pages/PitchVSL";
import NotFound from "./pages/NotFound";
import Thanks from "./pages/Thanks";
import PitchRES from "./pages/PitchRES";
import Webinar from "./pages/Webinar";
import Training from "./pages/Training";
import TrainingThanks from "./pages/TrainingThanks";
import JuaniResults from "./pages/JuaniResults";
import SakhileResults from "./pages/SakhileResults";
import Results from "./pages/Results";
import Rebook from "./pages/Rebook";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/webinar" element={<Webinar />} />
      <Route path="/pitch-vsl" element={<PitchVSL />} />
      <Route path="/pitch/res" element={<PitchRES />} />
      <Route path="/pitch" element={<PitchVSL />} />
      <Route path="/results" element={<Results />} />
      <Route path="/thank-you" element={<Thanks />} />
      <Route path="/rebook" element={<Rebook />} />
      <Route path="/training" element={<Training />} />
      <Route path="/training-vsl" element={<Training />} />
      <Route path="/training/thank-you" element={<TrainingThanks />} />
      <Route path="/juani-results" element={<JuaniResults />} />
      <Route path="/sakhile-results" element={<SakhileResults />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
