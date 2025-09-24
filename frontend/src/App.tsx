// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ProtectedRoute from '../src/Components/ProtectedRoute';

// Import pages (you will create these in the next steps)
import LoginPage from '../src/Pages/LoginPage';
import DashboardPage from '../src/Pages/DashboardPage';
import ArtistsListPage from '../src/Pages/ArtistListPage';
import ArtworksListPage from '../src/Pages/ArtworksListPage';
import ProfilePage from '../src/Pages/ProfilePage';
import ArtistDetailPage from '../src/Pages/ArtistDetailPage';
import ArtworkDetailPage from '../src/Pages/ArtworkDetailPage';

import AppLayout from '../src/Components/AppLayout';

function App() {
  return (
    <Router>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#A36FFF', // Vibrant purple from your logo
            colorInfo: '#6A5ACD',    // Another blue/purple shade
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
            borderRadius: 8,
          },
          components: {
            Layout: {
              siderBg: '#ffffff',
              headerBg: '#ffffff',
            },
            Menu: {
              itemSelectedBg: 'linear-gradient(to right, #A36FFF, #FF7B8D)',
              itemSelectedColor: '#000000ff',
              itemHoverColor: '#A36FFF',
              itemHoverBg: 'rgba(163, 111, 255, 0.1)',
            },
            Button: {
              colorPrimary: '#A36FFF',
              colorPrimaryHover: '#FF7B8D',
              colorPrimaryActive: '#6A5ACD',
            },
          },
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/artists" element={<ArtistsListPage />} />
                    <Route path="/artists/:id" element={<ArtistDetailPage />} />
                    <Route path="/artworks" element={<ArtworksListPage />} />
                    <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    
                    {/* Add other protected routes here */}
                  </Routes>
                </AppLayout>
              }
            />
          </Route>
        </Routes>
      </ConfigProvider>
    </Router>
  );
}

export default App;