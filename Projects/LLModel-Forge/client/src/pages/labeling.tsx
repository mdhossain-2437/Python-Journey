import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, SkipForward, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const CLASSES = [
  { id: 1, name: "Defect: Scratch", color: "bg-red-500" },
  { id: 2, name: "Defect: Dent", color: "bg-orange-500" },
  { id: 3, name: "Defect: Paint", color: "bg-yellow-500" },
  { id: 4, name: "No Defect", color: "bg-green-500" },
];

export default function Labeling() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1617791160536-598cf32026fb?auto=format&fit=crop&q=80&w=800"
  ];

  const handleAction = (action: string) => {
    // Mock action
    console.log(`Action: ${action} on image ${currentImageIndex}`);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setSelectedClass(null);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Labeling</h1>
          <p className="text-muted-foreground mt-2">Quality Assurance Queue: Industrial Defect Detection</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
          <span>Progress: 145/2000</span>
          <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[7%]"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Main Canvas Area */}
        <Card className="lg:col-span-3 border-border bg-black/40 backdrop-blur-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <button className="p-2 bg-black/50 hover:bg-black/70 rounded-md text-white border border-white/10 transition-colors">
              <ZoomIn className="h-5 w-5" />
            </button>
            <button className="p-2 bg-black/50 hover:bg-black/70 rounded-md text-white border border-white/10 transition-colors">
              <ZoomOut className="h-5 w-5" />
            </button>
            <button className="p-2 bg-black/50 hover:bg-black/70 rounded-md text-white border border-white/10 transition-colors">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4">
             <img 
               src={images[currentImageIndex]} 
               alt="To Label" 
               className="max-h-full max-w-full object-contain rounded-md shadow-2xl ring-1 ring-white/10"
             />
          </div>

          <div className="h-20 border-t border-white/10 bg-black/20 flex items-center justify-center gap-4 backdrop-blur-md">
            <button 
              onClick={() => handleAction('reject')}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all"
            >
              <X className="h-5 w-5" /> Reject
            </button>
            <button 
              onClick={() => handleAction('skip')}
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-muted text-muted-foreground border border-white/5 hover:bg-white/10 hover:text-white transition-all"
            >
              <SkipForward className="h-5 w-5" /> Skip
            </button>
            <button 
              onClick={() => handleAction('approve')}
              className={cn(
                "flex items-center gap-2 px-8 py-2 rounded-full border transition-all shadow-[0_0_15px_-3px_var(--color-primary)]",
                selectedClass 
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                  : "bg-muted/20 text-muted-foreground border-white/5 cursor-not-allowed opacity-50"
              )}
              disabled={!selectedClass}
            >
              <Check className="h-5 w-5" /> Submit Label
            </button>
          </div>
        </Card>

        {/* Sidebar Controls */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Select Class</h3>
              <div className="space-y-2">
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      selectedClass === cls.id 
                        ? "border-primary bg-primary/10 ring-1 ring-primary" 
                        : "border-border bg-background hover:bg-accent"
                    )}
                  >
                    <div className={cn("h-3 w-3 rounded-full", cls.color)} />
                    <span className="font-medium">{cls.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">{cls.id}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
             <CardContent className="p-4">
               <h3 className="font-semibold text-sm text-muted-foreground mb-2">Shortcuts</h3>
               <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                 <div className="flex justify-between"><span>1-4</span> <span>Class</span></div>
                 <div className="flex justify-between"><span>Enter</span> <span>Submit</span></div>
                 <div className="flex justify-between"><span>Esc</span> <span>Skip</span></div>
                 <div className="flex justify-between"><span>Space</span> <span>Next</span></div>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
