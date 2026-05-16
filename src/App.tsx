import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ArticlePage from "./pages/ArticlePage.tsx";
import WritePage from "./pages/WritePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";

import TagPage from "./pages/TagPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import NotificationsPage from "./pages/NotificationsPage.tsx";
import SavedPage from "./pages/SavedPage.tsx";
import WalletPage from "./pages/WalletPage.tsx";
import CommunityPage from "./pages/CommunityPage.tsx";
import MembersPage from "./pages/MembersPage.tsx";
import ForumsPage from "./pages/ForumsPage.tsx";
import ForumThreadPage from "./pages/ForumThreadPage.tsx";
import CreateForumPage from "./pages/CreateForumPage.tsx";
import PollsPage from "./pages/PollsPage.tsx";
import PollDetailPage from "./pages/PollDetailPage.tsx";
import CreatePollPage from "./pages/CreatePollPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import { Navbar } from "./components/Navbar.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/post/:id/*" element={<ArticlePage />} />
            <Route path="/write" element={<WritePage />} />
            
            <Route path="/tag/:tag" element={<TagPage />} />
            <Route path="/user/:username" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/members" element={<MembersPage />} />
            <Route path="/forums" element={<ForumsPage />} />
            <Route path="/forums/new" element={<CreateForumPage />} />
            <Route path="/forums/:id" element={<ForumThreadPage />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/polls/new" element={<CreatePollPage />} />
            <Route path="/polls/:id" element={<PollDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
