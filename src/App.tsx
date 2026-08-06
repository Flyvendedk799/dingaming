import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import WLoader from "@/components/WLoader";

/**
 * Route loading strategy.
 *
 * Everything used to be imported eagerly, so a shopper's first visit
 * downloaded the admin panel, six casino games, the club and every auth screen
 * before it could paint a price.
 *
 * Eager: the shopping funnel — the pages people actually land on, including
 * from search results. Splitting these would trade a smaller download for a
 * second round trip on exactly the pages that must be fast.
 *
 * Lazy: everything reached by deliberate navigation, which can afford one
 * fetch behind a loader.
 */
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CategoriesPage from "./pages/CategoriesPage";
import SearchPage from "./pages/SearchPage";

const DealsPage = lazy(() => import("./pages/DealsPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ThankYouPage = lazy(() => import("./pages/ThankYouPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

// The admin panel is one person's tool; it has no business in a customer's
// download at all.
const AdminPage = lazy(() => import("./pages/AdminPage"));

const ClubPage = lazy(() => import("./pages/ClubPage"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const CasesPage = lazy(() => import("./pages/CasesPage"));

const CasinoLobbyPage = lazy(() => import("./pages/CasinoLobbyPage"));
const MinesRoomPage = lazy(() => import("./pages/MinesRoomPage"));
const DiceRoomPage = lazy(() => import("./pages/DiceRoomPage"));
const BlackjackRoomPage = lazy(() => import("./pages/BlackjackRoomPage"));
const RouletteRoomPage = lazy(() => import("./pages/RouletteRoomPage"));
const HiLoRoomPage = lazy(() => import("./pages/HiLoRoomPage"));
const LinesRoomPage = lazy(() => import("./pages/LinesRoomPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<WLoader fullscreen />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product/:handle" element={<ProductPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              <Route path="/club" element={<ProtectedRoute><ClubPage /></ProtectedRoute>} />
              <Route path="/club/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
              <Route path="/club/casino" element={<ProtectedRoute><CasinoLobbyPage /></ProtectedRoute>} />
              <Route path="/club/casino/mines" element={<ProtectedRoute><MinesRoomPage /></ProtectedRoute>} />
              <Route path="/club/casino/dice" element={<ProtectedRoute><DiceRoomPage /></ProtectedRoute>} />
              <Route path="/club/casino/blackjack" element={<ProtectedRoute><BlackjackRoomPage /></ProtectedRoute>} />
              <Route path="/club/casino/roulette" element={<ProtectedRoute><RouletteRoomPage /></ProtectedRoute>} />
              <Route path="/club/casino/hilo" element={<ProtectedRoute><HiLoRoomPage /></ProtectedRoute>} />
              <Route path="/club/casino/lines" element={<ProtectedRoute><LinesRoomPage /></ProtectedRoute>} />
              <Route path="/club/games" element={<Navigate to="/club/casino" replace />} />
              <Route path="/club/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/thank-you" element={<ThankYouPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
