import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Taxonomy from "./pages/Taxonomy";
import NotFound from "./pages/NotFound";
import MarkdownPage from "./components/MarkdownPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/taxonomy" element={<Taxonomy />} />
          <Route path="/taxonomy-details" element={<MarkdownPage filePath="/docs/taxonomy.md" backLabel="Back to Scanner" backTo="/" />} />
          <Route path="/readme" element={<MarkdownPage filePath="/docs/readme.md" backLabel="Back to Scanner" backTo="/" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
