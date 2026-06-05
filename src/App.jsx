import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Calendario from './pages/Calendario.jsx';
import Presenca from './pages/Presenca.jsx';
import Mensalistas from './pages/Mensalistas.jsx';
import Comprovantes from './pages/Comprovantes.jsx';
import Highlights from './pages/Highlights.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="presenca/:date" element={<Presenca />} />
          <Route path="mensalistas" element={<Mensalistas />} />
          <Route path="comprovantes" element={<Comprovantes />} />
          <Route path="highlights" element={<Highlights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
