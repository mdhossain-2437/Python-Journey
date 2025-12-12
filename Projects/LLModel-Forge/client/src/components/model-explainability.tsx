import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import {
  Sparkles,
  Loader2,
  Info,
  TrendingUp,
  TrendingDown,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureImportance {
  feature: string;
  importance: number;
  contribution: number;
  direction: "positive" | "negative";
}

interface ExplainabilityProps {
  modelId?: string;
  predictionResult?: {
    score: number;
    risk: string;
  };
  features?: Record<string, number>;
}

// Simulated SHAP values for demonstration
const generateSHAPValues = (features: Record<string, number>): FeatureImportance[] => {
  const shapValues: FeatureImportance[] = [
    {
      feature: "Credit Score",
      importance: Math.abs(features.creditScore - 700) / 100,
      contribution: (features.creditScore - 700) / 100,
      direction: features.creditScore >= 700 ? "positive" : "negative"
    },
    {
      feature: "Annual Income",
      importance: Math.log10(features.annualIncome) / 5 - 1,
      contribution: (Math.log10(features.annualIncome) - 4.7) * 0.5,
      direction: features.annualIncome >= 50000 ? "positive" : "negative"
    },
    {
      feature: "Debt-to-Income",
      importance: features.debtToIncome / 50,
      contribution: -(features.debtToIncome - 30) / 50,
      direction: features.debtToIncome <= 30 ? "positive" : "negative"
    },
    {
      feature: "Age",
      importance: Math.abs(features.age - 40) / 40,
      contribution: (features.age - 25) / 50,
      direction: features.age >= 25 ? "positive" : "negative"
    },
    {
      feature: "Loan Amount",
      importance: features.loanAmount / 100000,
      contribution: -(features.loanAmount - 50000) / 100000,
      direction: features.loanAmount <= 50000 ? "positive" : "negative"
    },
  ];

  return shapValues.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
};

export default function ModelExplainability({
  modelId,
  predictionResult,
  features = {
    creditScore: 720,
    annualIncome: 75000,
    debtToIncome: 28,
    age: 35,
    loanAmount: 25000
  }
}: ExplainabilityProps) {
  const [loading, setLoading] = useState(false);
  const [shapValues, setShapValues] = useState<FeatureImportance[]>(() =>
    generateSHAPValues(features)
  );
  const [selectedMethod, setSelectedMethod] = useState<"shap" | "lime">("shap");

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setShapValues(generateSHAPValues(features));
      setLoading(false);
    }, 1000);
  };

  const baseValue = 0.5;
  const totalContribution = shapValues.reduce((sum, v) => sum + v.contribution, 0);
  const finalScore = Math.min(1, Math.max(0, baseValue + totalContribution));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Model Explainability
          </h2>
          <p className="text-muted-foreground mt-1">
            Understand how features contribute to the model's predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMethod("shap")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              selectedMethod === "shap"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            SHAP
          </button>
          <button
            onClick={() => setSelectedMethod("lime")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              selectedMethod === "lime"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            LIME
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feature Importance Chart */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Feature Contributions
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapValues}
                    layout="vertical"
                    margin={{ left: 100, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      domain={[-0.5, 0.5]}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      stroke="hsl(var(--muted-foreground))"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toFixed(3), 'Contribution']}
                    />
                    <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                    <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                      {shapValues.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.direction === "positive" ? "#10b981" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prediction Summary */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Prediction Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base Value */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base Value</span>
                <span className="font-mono font-semibold">{(baseValue * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Feature Contributions */}
            <div className="space-y-2">
              {shapValues.slice(0, 5).map((item) => (
                <div
                  key={item.feature}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    {item.direction === "positive" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{item.feature}</span>
                  </div>
                  <span className={cn(
                    "font-mono text-sm font-medium",
                    item.direction === "positive" ? "text-green-500" : "text-red-500"
                  )}>
                    {item.contribution >= 0 ? "+" : ""}{(item.contribution * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Final Score */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center justify-between">
                <span className="font-medium">Final Score</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  {(finalScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    finalScore >= 0.7 ? "bg-green-500" :
                    finalScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${finalScore * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Re-analyze
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Explanation Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How to Interpret
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                Positive Contributions
              </h4>
              <p className="text-sm text-muted-foreground">
                Features with green bars increase the prediction score.
                Higher credit scores and income typically have positive effects.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                Negative Contributions
              </h4>
              <p className="text-sm text-muted-foreground">
                Features with red bars decrease the prediction score.
                High debt-to-income ratios or large loan amounts may have negative effects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

