import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Gauge, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; risk: string } | null>(null);
  
  const [inputs, setInputs] = useState({
    creditScore: 720,
    annualIncome: 65000,
    debtToIncome: 35,
    age: 32,
    loanAmount: 15000
  });

  const simulate = () => {
    setLoading(true);
    setResult(null);
    // Fake latency
    setTimeout(() => {
      const randomScore = Math.random();
      const risk = randomScore > 0.7 ? "High Risk" : randomScore > 0.3 ? "Moderate Risk" : "Low Risk";
      setResult({ score: randomScore, risk });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Model Score Simulator
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Test model behavior against hypothetical inputs. This tool queries the `credit_risk_v4` model endpoint directly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Input Form */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Feature Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Credit Score</Label>
                <span className="font-mono text-sm text-primary">{inputs.creditScore}</span>
              </div>
              <Slider 
                value={[inputs.creditScore]} 
                min={300} 
                max={850} 
                step={1} 
                onValueChange={(v) => setInputs({...inputs, creditScore: v[0]})}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Annual Income ($)</Label>
                <span className="font-mono text-sm text-primary">{inputs.annualIncome.toLocaleString()}</span>
              </div>
              <Slider 
                value={[inputs.annualIncome]} 
                min={20000} 
                max={200000} 
                step={1000} 
                onValueChange={(v) => setInputs({...inputs, annualIncome: v[0]})}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Debt-to-Income Ratio (%)</Label>
                <span className="font-mono text-sm text-primary">{inputs.debtToIncome}%</span>
              </div>
              <Slider 
                value={[inputs.debtToIncome]} 
                min={0} 
                max={100} 
                step={1} 
                onValueChange={(v) => setInputs({...inputs, debtToIncome: v[0]})}
                className="py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Applicant Age</Label>
                <Input 
                  type="number" 
                  value={inputs.age} 
                  onChange={(e) => setInputs({...inputs, age: parseInt(e.target.value)})}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Loan Amount ($)</Label>
                <Input 
                  type="number" 
                  value={inputs.loanAmount} 
                  onChange={(e) => setInputs({...inputs, loanAmount: parseInt(e.target.value)})}
                  className="bg-background/50"
                />
              </div>
            </div>

            <button 
              onClick={simulate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-md font-bold transition-all shadow-[0_0_20px_-5px_var(--color-primary)] disabled:opacity-50 disabled:shadow-none mt-4"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Gauge className="h-5 w-5" />}
              {loading ? "Computing Inference..." : "Simulate Prediction"}
            </button>
          </CardContent>
        </Card>

        {/* Results Area */}
        <div className="space-y-6">
          <Card className={cn(
            "border-border bg-card transition-all duration-500 min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden",
            result ? "border-primary/50 shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]" : "border-border/30"
          )}>
            {!result && !loading && (
              <div className="text-center text-muted-foreground opacity-50">
                <ArrowRight className="h-12 w-12 mx-auto mb-2" />
                <p>Run simulation to see results</p>
              </div>
            )}
            
            {loading && (
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="font-mono text-sm animate-pulse">Running inference on v4.2...</p>
              </div>
            )}

            {result && !loading && (
              <div className="text-center w-full p-8 animate-in zoom-in-50 duration-300">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Predicted Probability</h3>
                
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-48 w-48 -rotate-90 transform">
                    <circle
                      className="text-muted/20"
                      strokeWidth="12"
                      stroke="currentColor"
                      fill="transparent"
                      r="90"
                      cx="96"
                      cy="96"
                    />
                    <circle
                      className={cn(
                        "transition-all duration-1000 ease-out",
                        result.score > 0.7 ? "text-destructive" : result.score > 0.3 ? "text-yellow-500" : "text-green-500"
                      )}
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={2 * Math.PI * 90 * (1 - result.score)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="90"
                      cx="96"
                      cy="96"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-bold font-mono tracking-tighter">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                    <span className={cn(
                      "text-sm font-bold uppercase mt-1 px-2 py-0.5 rounded",
                      result.score > 0.7 ? "bg-destructive/20 text-destructive" : result.score > 0.3 ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500"
                    )}>
                      {result.risk}
                    </span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                  <div className="p-3 bg-muted/30 rounded border border-border">
                    <div className="text-xs text-muted-foreground uppercase">Confidence</div>
                    <div className="font-mono font-bold">98.2%</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded border border-border">
                    <div className="text-xs text-muted-foreground uppercase">Inference Time</div>
                    <div className="font-mono font-bold">42ms</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {result && result.score > 0.7 && (
            <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-md flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold">High Risk Alert</h4>
                <p className="text-sm opacity-90">This prediction exceeds the threshold for automatic approval. Manual review would be triggered in production.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
