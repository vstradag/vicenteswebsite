import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const MobileMain = lazy(() => import("./components/MobileMain"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const Play = lazy(() => import("./pages/Play"));
import { LoadingProvider } from "./context/LoadingProvider";
import { useIsMobile } from "./hooks/useIsMobile";

function HomePage() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <LoadingProvider>
        <Suspense fallback={null}>
          <MobileMain />
        </Suspense>
      </LoadingProvider>
    );
  }
  return (
    <LoadingProvider>
      <Suspense fallback={null}>
        <MainContainer>
          <Suspense fallback={null}>
            <CharacterModel />
          </Suspense>
        </MainContainer>
      </Suspense>
    </LoadingProvider>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/myworks"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <MyWorks />
            </Suspense>
          }
        />
        <Route
          path="/play"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Play />
            </Suspense>
          }
        />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
};

export default App;
