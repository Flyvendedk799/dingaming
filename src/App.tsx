import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import CategoriesPage from "./pages/CategoriesPage";
import DealsPage from "./pages/DealsPage";
import SupportPage from "./pages/SupportPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ClubPage from "./pages/ClubPage";
import RewardsPage from "./pages/RewardsPage";
import GamesPage from "./pages/GamesPage";
import CasesPage from "./pages/CasesPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import CasinoLobbyPage from "./pages/CasinoLobbyPage";
import MinesRoomPage from "./pages/MinesRoomPage";
import DiceRoomPage from "./pages/DiceRoomPage";
import BlackjackRoomPage from "./pages/BlackjackRoomPage";
import RouletteRoomPage from "./pages/RouletteRoomPage";
import HiLoRoomPage from "./pages/HiLoRoomPage";
import LinesRoomPage from "./pages/LinesRoomPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/product/:handle" element={<ProductPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/club" element={<ClubPage />} />
            <Route path="/club/rewards" element={<RewardsPage />} />
            {/* New Casino Routes */}
            <Route path="/club/casino" element={<CasinoLobbyPage />} />
            <Route path="/club/casino/mines" element={<MinesRoomPage />} />
            <Route path="/club/casino/dice" element={<DiceRoomPage />} />
            <Route path="/club/casino/blackjack" element={<BlackjackRoomPage />} />
            <Route path="/club/casino/roulette" element={<RouletteRoomPage />} />
            <Route path="/club/casino/hilo" element={<HiLoRoomPage />} />
            <Route path="/club/casino/lines" element={<LinesRoomPage />} />
            {/* Redirect old games page to new casino lobby */}
            <Route path="/club/games" element={<Navigate to="/club/casino" replace />} />
            <Route path="/club/cases" element={<CasesPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
