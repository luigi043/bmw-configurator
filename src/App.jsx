import { Suspense } from 'react';
import CarScene from './components/Scene/CarScene.jsx';
import ConfiguratorPanel from './components/UI/ConfiguratorPanel.jsx';
import PriceBar from './components/UI/PriceBar.jsx';
import Loader from './components/UI/Loader.jsx';
import Header from './components/UI/Header.jsx';

export default function App() {
  return (
    <div className="app">
      <Header />

      <Suspense fallback={<Loader />}>
        <CarScene />
      </Suspense>

      <ConfiguratorPanel />
      <PriceBar />
    </div>
  );
}
