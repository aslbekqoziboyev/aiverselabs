import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Gallery from "./pages/Gallery";
import Upload from "./pages/Upload";
import AIGenerate from "./pages/AIGenerate";
import AIMusic from "./pages/AIMusic";
import MyMusic from "./pages/MyMusic";
import AIVideo from "./pages/AIVideo";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full flex-col">
              <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
                <SidebarTrigger />
              </header>
              <div className="flex flex-1 w-full">
                <AppSidebar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Gallery />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/ai-generate" element={<AIGenerate />} />
                    <Route path="/ai-music" element={<AIMusic />} />
                    <Route path="/my-music" element={<MyMusic />} />
                    <Route path="/ai-video" element={<AIVideo />} />
                    <Route path="/chats" element={<Chats />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/auth" element={<Auth />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
