import { useState, useEffect } from "react";
import { Search, History, Plus, Loader2, BookOpen, Share2, Download, Trash2, Globe, FileText, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { performResearch } from "@/src/lib/gemini";
import { cn } from "@/lib/utils";

interface ResearchHistory {
  id: string;
  query: string;
  result: string;
  sources: any;
  timestamp: number;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ text: string; sources: any } | null>(null);
  const [history, setHistory] = useState<ResearchHistory[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem("research_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (query: string, result: string, sources: any) => {
    const newItem: ResearchHistory = {
      id: Math.random().toString(36).substring(7),
      query,
      result,
      sources,
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("research_history", JSON.stringify(updatedHistory));
    setActiveId(newItem.id);
  };

  const handleResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isResearching) return;

    setIsResearching(true);
    setCurrentResult(null);
    setProgress("Analyzing your request...");

    try {
      const result = await performResearch(query, (step) => setProgress(step));
      setCurrentResult({ text: result.text || "", sources: result.groundingMetadata });
      saveToHistory(query, result.text || "", result.groundingMetadata);
    } catch (error) {
      console.error(error);
      setProgress("An error occurred during research.");
    } finally {
      setIsResearching(false);
    }
  };

  const loadFromHistory = (item: ResearchHistory) => {
    setQuery(item.query);
    setCurrentResult({ text: item.result, sources: item.sources });
    setActiveId(item.id);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("research_history", JSON.stringify(updatedHistory));
    if (activeId === id) {
      setActiveId(null);
      setCurrentResult(null);
      setQuery("");
    }
  };

  const startNew = () => {
    setActiveId(null);
    setCurrentResult(null);
    setQuery("");
  };

  const copyToClipboard = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col min-h-0">
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">InsightFlow</h1>
        </div>

        <div className="px-4 mb-4">
          <Button 
            onClick={startNew}
            variant="outline" 
            className="w-full justify-start gap-2 bg-white border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Research
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="space-y-1">
            <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <History className="w-3 h-3" />
              Recent Research
            </div>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200",
                  activeId === item.id 
                    ? "bg-indigo-50 text-indigo-700 font-medium" 
                    : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <FileText className={cn("w-4 h-4 shrink-0", activeId === item.id ? "text-indigo-600" : "text-slate-400")} />
                <span className="truncate text-sm pr-6">{item.query}</span>
                <button
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {history.length === 0 && (
              <div className="px-3 py-8 text-center text-slate-400 text-sm italic">
                No history yet
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 bg-white/50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
              SK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Samuel K.</p>
              <p className="text-xs text-slate-500 truncate">Pro Researcher</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 relative bg-white">
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {activeId && (
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                Research Report
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentResult && (
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-2 text-slate-500">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-4xl mx-auto px-8 py-12">
            {!currentResult && !isResearching ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
                  <Search className="w-8 h-8" />
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
                  What would you like to research?
                </h2>
                <p className="text-lg text-slate-500 mb-8 max-w-lg">
                  InsightFlow searches the web, analyzes sources, and builds a comprehensive report for you.
                </p>
                
                <form onSubmit={handleResearch} className="w-full max-w-2xl relative group">
                  <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full group-focus-within:bg-indigo-500/10 transition-all"></div>
                  <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. Impact of quantum computing on cybersecurity..."
                      className="pl-12 pr-32 h-14 text-lg rounded-2xl border-slate-200 shadow-sm focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                    />
                    <Button 
                      type="submit"
                      disabled={!query.trim()}
                      className="absolute right-2 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6"
                    >
                      Research
                    </Button>
                  </div>
                </form>

                <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    "Future of sustainable energy",
                    "History of the Renaissance",
                    "Latest breakthroughs in AI",
                    "Economic impact of remote work"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        // Trigger research immediately
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        setTimeout(() => handleResearch(fakeEvent), 100);
                      }}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-100 text-left text-sm text-slate-600 transition-all group"
                    >
                      <span className="block font-medium text-slate-900 group-hover:text-indigo-700 mb-1">Explore</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Research Query</span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{query}</h2>
                </div>

                {isResearching && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-700">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-medium">{progress}</span>
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <div className="grid grid-cols-3 gap-4 mt-8">
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentResult && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    {/* Sources */}
                    {currentResult.sources?.searchEntryPoint && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-semibold">
                          <Globe className="w-4 h-4 text-indigo-600" />
                          <h3>Verified Sources</h3>
                        </div>
                        <div 
                          className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm prose prose-slate max-w-none"
                          dangerouslySetInnerHTML={{ __html: currentResult.sources.searchEntryPoint.renderedContent }}
                        />
                      </section>
                    )}

                    {/* Report Content */}
                    <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-indigo-700 prose-a:text-indigo-600 hover:prose-a:text-indigo-800">
                      <ReactMarkdown>{currentResult.text}</ReactMarkdown>
                    </article>

                    <Separator className="bg-slate-100" />
                    
                    <div className="flex items-center justify-between py-8">
                      <div className="text-sm text-slate-400 italic">
                        Generated by InsightFlow AI • {new Date().toLocaleDateString()}
                      </div>
                      <Button variant="outline" onClick={startNew} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Start New Research
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Floating Search Bar (when result is active) */}
        <AnimatePresence>
          {(currentResult || isResearching) && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20"
            >
              <form onSubmit={handleResearch} className="relative flex items-center">
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-200/50 border border-slate-200"></div>
                <Search className="absolute left-4 w-5 h-5 text-slate-400 z-10" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a follow-up or start new research..."
                  className="relative z-10 pl-12 pr-32 h-14 bg-transparent border-none focus-visible:ring-0 text-slate-900"
                />
                <Button 
                  type="submit"
                  disabled={!query.trim() || isResearching}
                  className="absolute right-2 z-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6"
                >
                  {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Research"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
