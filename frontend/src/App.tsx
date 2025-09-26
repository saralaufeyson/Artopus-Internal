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
import ArtistFormPage from '../src/Pages/ArtistFormPage'; // <-- Imported
import ArtworkFormPage from '../src/Pages/ArtworkFormPage'; // <-- Imported


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

          {/* This Route catches all paths for authenticated users and wraps them in ProtectedRoute and AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/*" // Match any sub-path here
              element={
                <AppLayout>
                  {/* Inner Routes for pages displayed within the AppLayout */}
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* ARTISTS ROUTES */}
                    <Route path="/artists" element={<ArtistsListPage />} />
                    {/* IMPORTANT: Place 'new' and 'edit' routes BEFORE the dynamic ':id' route */}
                    <Route path="/artists/new" element={<ArtistFormPage />} />
                    <Route path="/artists/edit/:id" element={<ArtistFormPage />} />
                    <Route path="/artists/:id" element={<ArtistDetailPage />} />

                    {/* ARTWORKS ROUTES */}
                    <Route path="/artworks" element={<ArtworksListPage />} />
                    {/* IMPORTANT: Place 'new' and 'edit' routes BEFORE the dynamic ':id' route */}
                    <Route path="/artworks/new" element={<ArtworkFormPage />} />
                    <Route path="/artworks/edit/:id" element={<ArtworkFormPage />} />
                    <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
                    
                    <Route path="/profile" element={<ProfilePage />} />
                    
                    {/* Add other protected routes here if needed */}
                    {/* Example: <Route path="/reports" element={<ReportsPage />} /> */}

                    {/* Fallback for any unmatched paths within the protected area */}
                    <Route path="*" element={<div>404 - Page Not Found</div>} />
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