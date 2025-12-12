/**
 * Advanced ML Mathematics Engine
 *
 * Implements proper mathematical foundations for ML:
 * - Linear Algebra Operations
 * - Calculus & Optimization
 * - Probability & Statistics
 * - Information Theory
 * - Quantum Computing Basics
 */

// ==================== LINEAR ALGEBRA ====================

/**
 * Matrix class for ML operations
 */
export class Matrix {
  data: number[][];
  rows: number;
  cols: number;

  constructor(data: number[][]) {
    this.data = data;
    this.rows = data.length;
    this.cols = data[0]?.length || 0;
  }

  static zeros(rows: number, cols: number): Matrix {
    return new Matrix(Array(rows).fill(null).map(() => Array(cols).fill(0)));
  }

  static ones(rows: number, cols: number): Matrix {
    return new Matrix(Array(rows).fill(null).map(() => Array(cols).fill(1)));
  }

  static identity(n: number): Matrix {
    const data = Array(n).fill(null).map((_, i) =>
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );
    return new Matrix(data);
  }

  static random(rows: number, cols: number, scale: number = 1): Matrix {
    return new Matrix(
      Array(rows).fill(null).map(() =>
        Array(cols).fill(null).map(() => (Math.random() - 0.5) * 2 * scale)
      )
    );
  }

  // Xavier/Glorot initialization
  static xavier(rows: number, cols: number): Matrix {
    const scale = Math.sqrt(2 / (rows + cols));
    return Matrix.random(rows, cols, scale);
  }

  // He initialization (for ReLU)
  static he(rows: number, cols: number): Matrix {
    const scale = Math.sqrt(2 / rows);
    return Matrix.random(rows, cols, scale);
  }

  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error("Matrix dimensions must match for addition");
    }
    return new Matrix(
      this.data.map((row, i) => row.map((val, j) => val + other.data[i][j]))
    );
  }

  subtract(other: Matrix): Matrix {
    return new Matrix(
      this.data.map((row, i) => row.map((val, j) => val - other.data[i][j]))
    );
  }

  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error(`Cannot multiply ${this.rows}x${this.cols} with ${other.rows}x${other.cols}`);
    }
    const result = Matrix.zeros(this.rows, other.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < other.cols; j++) {
        let sum = 0;
        for (let k = 0; k < this.cols; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  scale(scalar: number): Matrix {
    return new Matrix(this.data.map(row => row.map(val => val * scalar)));
  }

  transpose(): Matrix {
    const result = Matrix.zeros(this.cols, this.rows);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        result.data[j][i] = this.data[i][j];
      }
    }
    return result;
  }

  // Hadamard (element-wise) product
  hadamard(other: Matrix): Matrix {
    return new Matrix(
      this.data.map((row, i) => row.map((val, j) => val * other.data[i][j]))
    );
  }

  // Frobenius norm
  norm(): number {
    let sum = 0;
    for (const row of this.data) {
      for (const val of row) {
        sum += val * val;
      }
    }
    return Math.sqrt(sum);
  }

  // Trace
  trace(): number {
    let sum = 0;
    const n = Math.min(this.rows, this.cols);
    for (let i = 0; i < n; i++) {
      sum += this.data[i][i];
    }
    return sum;
  }

  // Apply function element-wise
  map(fn: (x: number) => number): Matrix {
    return new Matrix(this.data.map(row => row.map(fn)));
  }

  // Sum all elements
  sum(): number {
    return this.data.reduce((acc, row) => acc + row.reduce((a, b) => a + b, 0), 0);
  }

  // Mean of all elements
  mean(): number {
    return this.sum() / (this.rows * this.cols);
  }

  // Flatten to 1D array
  flatten(): number[] {
    return this.data.flat();
  }

  // Clone
  clone(): Matrix {
    return new Matrix(this.data.map(row => [...row]));
  }
}

// ==================== ACTIVATION FUNCTIONS ====================

export const Activations = {
  sigmoid: (x: number): number => 1 / (1 + Math.exp(-x)),
  sigmoidDerivative: (x: number): number => {
    const s = Activations.sigmoid(x);
    return s * (1 - s);
  },

  tanh: (x: number): number => Math.tanh(x),
  tanhDerivative: (x: number): number => 1 - Math.pow(Math.tanh(x), 2),

  relu: (x: number): number => Math.max(0, x),
  reluDerivative: (x: number): number => x > 0 ? 1 : 0,

  leakyRelu: (x: number, alpha: number = 0.01): number => x > 0 ? x : alpha * x,
  leakyReluDerivative: (x: number, alpha: number = 0.01): number => x > 0 ? 1 : alpha,

  elu: (x: number, alpha: number = 1): number => x > 0 ? x : alpha * (Math.exp(x) - 1),
  eluDerivative: (x: number, alpha: number = 1): number => x > 0 ? 1 : Activations.elu(x, alpha) + alpha,

  swish: (x: number): number => x * Activations.sigmoid(x),
  swishDerivative: (x: number): number => {
    const s = Activations.sigmoid(x);
    return s + x * s * (1 - s);
  },

  gelu: (x: number): number => {
    // Gaussian Error Linear Unit
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
  },

  softmax: (arr: number[]): number[] => {
    const max = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  },
};

// ==================== LOSS FUNCTIONS ====================

export const LossFunctions = {
  mse: (predicted: number[], actual: number[]): number => {
    const n = predicted.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.pow(predicted[i] - actual[i], 2);
    }
    return sum / n;
  },

  mseGradient: (predicted: number[], actual: number[]): number[] => {
    const n = predicted.length;
    return predicted.map((p, i) => (2 / n) * (p - actual[i]));
  },

  mae: (predicted: number[], actual: number[]): number => {
    const n = predicted.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.abs(predicted[i] - actual[i]);
    }
    return sum / n;
  },

  crossEntropy: (predicted: number[], actual: number[]): number => {
    const epsilon = 1e-15;
    let sum = 0;
    for (let i = 0; i < predicted.length; i++) {
      const p = Math.max(epsilon, Math.min(1 - epsilon, predicted[i]));
      sum -= actual[i] * Math.log(p) + (1 - actual[i]) * Math.log(1 - p);
    }
    return sum / predicted.length;
  },

  categoricalCrossEntropy: (predicted: number[], actual: number[]): number => {
    const epsilon = 1e-15;
    let sum = 0;
    for (let i = 0; i < predicted.length; i++) {
      sum -= actual[i] * Math.log(Math.max(epsilon, predicted[i]));
    }
    return sum;
  },

  huber: (predicted: number[], actual: number[], delta: number = 1): number => {
    let sum = 0;
    for (let i = 0; i < predicted.length; i++) {
      const error = Math.abs(predicted[i] - actual[i]);
      if (error <= delta) {
        sum += 0.5 * error * error;
      } else {
        sum += delta * (error - 0.5 * delta);
      }
    }
    return sum / predicted.length;
  },

  // Kullback-Leibler Divergence
  klDivergence: (p: number[], q: number[]): number => {
    const epsilon = 1e-15;
    let sum = 0;
    for (let i = 0; i < p.length; i++) {
      if (p[i] > epsilon) {
        sum += p[i] * Math.log(p[i] / Math.max(epsilon, q[i]));
      }
    }
    return sum;
  },
};

// ==================== OPTIMIZERS ====================

export interface OptimizerState {
  step: number;
  m?: Matrix; // First moment
  v?: Matrix; // Second moment
}

export const Optimizers = {
  sgd: (gradient: Matrix, lr: number): Matrix => {
    return gradient.scale(-lr);
  },

  sgdMomentum: (gradient: Matrix, lr: number, momentum: number, velocity: Matrix): { update: Matrix; velocity: Matrix } => {
    const newVelocity = velocity.scale(momentum).subtract(gradient.scale(lr));
    return { update: newVelocity, velocity: newVelocity };
  },

  adam: (
    gradient: Matrix,
    state: OptimizerState,
    lr: number = 0.001,
    beta1: number = 0.9,
    beta2: number = 0.999,
    epsilon: number = 1e-8
  ): { update: Matrix; state: OptimizerState } => {
    const t = state.step + 1;

    // Initialize moments if not present
    const m = state.m || Matrix.zeros(gradient.rows, gradient.cols);
    const v = state.v || Matrix.zeros(gradient.rows, gradient.cols);

    // Update biased first moment estimate
    const newM = m.scale(beta1).add(gradient.scale(1 - beta1));

    // Update biased second raw moment estimate
    const newV = v.scale(beta2).add(gradient.hadamard(gradient).scale(1 - beta2));

    // Bias correction
    const mHat = newM.scale(1 / (1 - Math.pow(beta1, t)));
    const vHat = newV.scale(1 / (1 - Math.pow(beta2, t)));

    // Compute update
    const update = mHat.map((m, i) => {
      // This is simplified - in practice you'd iterate properly
      return m;
    });

    const denom = vHat.map(v => Math.sqrt(v) + epsilon);
    const finalUpdate = new Matrix(
      mHat.data.map((row, i) =>
        row.map((m, j) => -lr * m / (Math.sqrt(vHat.data[i][j]) + epsilon))
      )
    );

    return {
      update: finalUpdate,
      state: { step: t, m: newM, v: newV }
    };
  },

  adamW: (
    gradient: Matrix,
    weights: Matrix,
    state: OptimizerState,
    lr: number = 0.001,
    beta1: number = 0.9,
    beta2: number = 0.999,
    epsilon: number = 1e-8,
    weightDecay: number = 0.01
  ): { update: Matrix; state: OptimizerState } => {
    // Adam with decoupled weight decay
    const adamResult = Optimizers.adam(gradient, state, lr, beta1, beta2, epsilon);
    const decay = weights.scale(-lr * weightDecay);
    return {
      update: adamResult.update.add(decay),
      state: adamResult.state
    };
  },
};

// ==================== REGULARIZATION ====================

export const Regularization = {
  l1: (weights: Matrix, lambda: number): number => {
    return lambda * weights.data.reduce((acc, row) =>
      acc + row.reduce((a, w) => a + Math.abs(w), 0), 0
    );
  },

  l1Gradient: (weights: Matrix, lambda: number): Matrix => {
    return weights.map(w => lambda * Math.sign(w));
  },

  l2: (weights: Matrix, lambda: number): number => {
    return (lambda / 2) * weights.data.reduce((acc, row) =>
      acc + row.reduce((a, w) => a + w * w, 0), 0
    );
  },

  l2Gradient: (weights: Matrix, lambda: number): Matrix => {
    return weights.scale(lambda);
  },

  elasticNet: (weights: Matrix, l1Ratio: number, lambda: number): number => {
    return l1Ratio * Regularization.l1(weights, lambda) +
           (1 - l1Ratio) * Regularization.l2(weights, lambda);
  },

  dropout: (matrix: Matrix, rate: number): { output: Matrix; mask: Matrix } => {
    const mask = matrix.map(() => Math.random() > rate ? 1 / (1 - rate) : 0);
    return {
      output: matrix.hadamard(mask),
      mask
    };
  },
};

// ==================== STATISTICS ====================

export const Statistics = {
  mean: (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length,

  variance: (arr: number[]): number => {
    const m = Statistics.mean(arr);
    return arr.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / arr.length;
  },

  std: (arr: number[]): number => Math.sqrt(Statistics.variance(arr)),

  covariance: (x: number[], y: number[]): number => {
    const meanX = Statistics.mean(x);
    const meanY = Statistics.mean(y);
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY);
    }
    return sum / x.length;
  },

  correlation: (x: number[], y: number[]): number => {
    const cov = Statistics.covariance(x, y);
    const stdX = Statistics.std(x);
    const stdY = Statistics.std(y);
    return cov / (stdX * stdY);
  },

  // Batch normalization
  batchNorm: (data: number[], gamma: number = 1, beta: number = 0, epsilon: number = 1e-5): number[] => {
    const mean = Statistics.mean(data);
    const variance = Statistics.variance(data);
    return data.map(x => gamma * (x - mean) / Math.sqrt(variance + epsilon) + beta);
  },

  // Layer normalization
  layerNorm: (data: number[], gamma: number = 1, beta: number = 0, epsilon: number = 1e-5): number[] => {
    const mean = Statistics.mean(data);
    const variance = Statistics.variance(data);
    return data.map(x => gamma * (x - mean) / Math.sqrt(variance + epsilon) + beta);
  },

  // Percentile
  percentile: (arr: number[], p: number): number => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  },

  // Z-score normalization
  zScore: (arr: number[]): number[] => {
    const m = Statistics.mean(arr);
    const s = Statistics.std(arr);
    return arr.map(x => (x - m) / s);
  },

  // Min-max normalization
  minMaxNorm: (arr: number[]): number[] => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map(x => (x - min) / range);
  },
};

// ==================== INFORMATION THEORY ====================

export const InformationTheory = {
  // Shannon entropy
  entropy: (probabilities: number[]): number => {
    return -probabilities.reduce((acc, p) => {
      if (p > 0) acc += p * Math.log2(p);
      return acc;
    }, 0);
  },

  // Joint entropy
  jointEntropy: (jointProb: number[][]): number => {
    let sum = 0;
    for (const row of jointProb) {
      for (const p of row) {
        if (p > 0) sum -= p * Math.log2(p);
      }
    }
    return sum;
  },

  // Mutual information
  mutualInformation: (jointProb: number[][], marginalX: number[], marginalY: number[]): number => {
    let mi = 0;
    for (let i = 0; i < jointProb.length; i++) {
      for (let j = 0; j < jointProb[i].length; j++) {
        const pxy = jointProb[i][j];
        if (pxy > 0) {
          mi += pxy * Math.log2(pxy / (marginalX[i] * marginalY[j]));
        }
      }
    }
    return mi;
  },

  // Cross entropy
  crossEntropy: (p: number[], q: number[]): number => {
    return -p.reduce((acc, pi, i) => {
      if (pi > 0) acc += pi * Math.log2(q[i]);
      return acc;
    }, 0);
  },
};

// ==================== QUANTUM COMPUTING BASICS ====================

/**
 * Complex number for quantum computations
 */
export class Complex {
  constructor(public real: number, public imag: number = 0) {}

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  scale(s: number): Complex {
    return new Complex(this.real * s, this.imag * s);
  }

  static fromPolar(r: number, theta: number): Complex {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }
}

/**
 * Quantum State Vector (for n qubits: 2^n amplitudes)
 */
export class QuantumState {
  amplitudes: Complex[];
  numQubits: number;

  constructor(numQubits: number) {
    this.numQubits = numQubits;
    const size = Math.pow(2, numQubits);
    this.amplitudes = Array(size).fill(null).map(() => new Complex(0, 0));
    this.amplitudes[0] = new Complex(1, 0); // |0...0⟩ state
  }

  // Measure probabilities
  probabilities(): number[] {
    return this.amplitudes.map(a => a.magnitude() ** 2);
  }

  // Normalize state
  normalize(): void {
    const norm = Math.sqrt(this.probabilities().reduce((a, b) => a + b, 0));
    this.amplitudes = this.amplitudes.map(a => a.scale(1 / norm));
  }

  // Apply single-qubit gate
  applyGate(gate: Complex[][], qubit: number): void {
    const size = this.amplitudes.length;
    const step = Math.pow(2, qubit);

    for (let i = 0; i < size; i += 2 * step) {
      for (let j = 0; j < step; j++) {
        const idx0 = i + j;
        const idx1 = i + j + step;

        const a0 = this.amplitudes[idx0];
        const a1 = this.amplitudes[idx1];

        this.amplitudes[idx0] = gate[0][0].multiply(a0).add(gate[0][1].multiply(a1));
        this.amplitudes[idx1] = gate[1][0].multiply(a0).add(gate[1][1].multiply(a1));
      }
    }
  }

  // Measure and collapse
  measure(): number {
    const probs = this.probabilities();
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (rand < cumulative) {
        // Collapse to measured state
        this.amplitudes = this.amplitudes.map((_, j) =>
          j === i ? new Complex(1, 0) : new Complex(0, 0)
        );
        return i;
      }
    }
    return probs.length - 1;
  }
}

// Quantum gates
export const QuantumGates = {
  // Pauli-X (NOT gate)
  X: [
    [new Complex(0), new Complex(1)],
    [new Complex(1), new Complex(0)]
  ],

  // Pauli-Y
  Y: [
    [new Complex(0), new Complex(0, -1)],
    [new Complex(0, 1), new Complex(0)]
  ],

  // Pauli-Z
  Z: [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(-1)]
  ],

  // Hadamard (superposition)
  H: [
    [new Complex(1 / Math.SQRT2), new Complex(1 / Math.SQRT2)],
    [new Complex(1 / Math.SQRT2), new Complex(-1 / Math.SQRT2)]
  ],

  // Phase gate
  S: [
    [new Complex(1), new Complex(0)],
    [new Complex(0), new Complex(0, 1)]
  ],

  // T gate (π/8 gate)
  T: [
    [new Complex(1), new Complex(0)],
    [new Complex(0), Complex.fromPolar(1, Math.PI / 4)]
  ],

  // Rotation gates
  Rx: (theta: number): Complex[][] => [
    [new Complex(Math.cos(theta / 2)), new Complex(0, -Math.sin(theta / 2))],
    [new Complex(0, -Math.sin(theta / 2)), new Complex(Math.cos(theta / 2))]
  ],

  Ry: (theta: number): Complex[][] => [
    [new Complex(Math.cos(theta / 2)), new Complex(-Math.sin(theta / 2))],
    [new Complex(Math.sin(theta / 2)), new Complex(Math.cos(theta / 2))]
  ],

  Rz: (theta: number): Complex[][] => [
    [Complex.fromPolar(1, -theta / 2), new Complex(0)],
    [new Complex(0), Complex.fromPolar(1, theta / 2)]
  ],
};

// ==================== LEARNING RATE SCHEDULERS ====================

export const LRSchedulers = {
  constant: (baseLr: number) => (_step: number) => baseLr,

  stepDecay: (baseLr: number, dropFactor: number, stepsPerDrop: number) =>
    (step: number) => baseLr * Math.pow(dropFactor, Math.floor(step / stepsPerDrop)),

  exponentialDecay: (baseLr: number, decayRate: number) =>
    (step: number) => baseLr * Math.exp(-decayRate * step),

  cosineAnnealing: (baseLr: number, minLr: number, totalSteps: number) =>
    (step: number) => minLr + (baseLr - minLr) * (1 + Math.cos(Math.PI * step / totalSteps)) / 2,

  warmupCosine: (baseLr: number, warmupSteps: number, totalSteps: number) =>
    (step: number) => {
      if (step < warmupSteps) {
        return baseLr * step / warmupSteps;
      }
      const progress = (step - warmupSteps) / (totalSteps - warmupSteps);
      return baseLr * (1 + Math.cos(Math.PI * progress)) / 2;
    },

  cyclicLR: (baseLr: number, maxLr: number, stepSize: number) =>
    (step: number) => {
      const cycle = Math.floor(1 + step / (2 * stepSize));
      const x = Math.abs(step / stepSize - 2 * cycle + 1);
      return baseLr + (maxLr - baseLr) * Math.max(0, 1 - x);
    },

  oneCycleLR: (maxLr: number, totalSteps: number, divFactor: number = 25) =>
    (step: number) => {
      const initialLr = maxLr / divFactor;
      const midPoint = totalSteps * 0.3;

      if (step < midPoint) {
        return initialLr + (maxLr - initialLr) * step / midPoint;
      } else {
        return maxLr - (maxLr - initialLr / 100) * (step - midPoint) / (totalSteps - midPoint);
      }
    },
};

// ==================== METRICS ====================

export const Metrics = {
  accuracy: (predictions: number[], labels: number[]): number => {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === labels[i]) correct++;
    }
    return correct / predictions.length;
  },

  precision: (predictions: number[], labels: number[], positiveClass: number = 1): number => {
    let truePositives = 0;
    let falsePositives = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === positiveClass) {
        if (labels[i] === positiveClass) truePositives++;
        else falsePositives++;
      }
    }
    return truePositives / (truePositives + falsePositives) || 0;
  },

  recall: (predictions: number[], labels: number[], positiveClass: number = 1): number => {
    let truePositives = 0;
    let falseNegatives = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (labels[i] === positiveClass) {
        if (predictions[i] === positiveClass) truePositives++;
        else falseNegatives++;
      }
    }
    return truePositives / (truePositives + falseNegatives) || 0;
  },

  f1Score: (predictions: number[], labels: number[], positiveClass: number = 1): number => {
    const prec = Metrics.precision(predictions, labels, positiveClass);
    const rec = Metrics.recall(predictions, labels, positiveClass);
    return 2 * prec * rec / (prec + rec) || 0;
  },

  confusionMatrix: (predictions: number[], labels: number[], numClasses: number): number[][] => {
    const matrix = Array(numClasses).fill(null).map(() => Array(numClasses).fill(0));
    for (let i = 0; i < predictions.length; i++) {
      matrix[labels[i]][predictions[i]]++;
    }
    return matrix;
  },

  auc: (scores: number[], labels: number[]): number => {
    // Simple AUC-ROC calculation
    const sorted = scores.map((s, i) => ({ score: s, label: labels[i] }))
      .sort((a, b) => b.score - a.score);

    let positives = 0;
    let negatives = 0;
    let sumRanks = 0;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].label === 1) {
        positives++;
        sumRanks += i + 1;
      } else {
        negatives++;
      }
    }

    return (sumRanks - positives * (positives + 1) / 2) / (positives * negatives);
  },

  // Mean Absolute Percentage Error
  mape: (predictions: number[], actuals: number[]): number => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (actuals[i] !== 0) {
        sum += Math.abs((actuals[i] - predictions[i]) / actuals[i]);
        count++;
      }
    }
    return (sum / count) * 100;
  },

  // R-squared
  r2Score: (predictions: number[], actuals: number[]): number => {
    const mean = Statistics.mean(actuals);
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < predictions.length; i++) {
      ssRes += Math.pow(actuals[i] - predictions[i], 2);
      ssTot += Math.pow(actuals[i] - mean, 2);
    }
    return 1 - ssRes / ssTot;
  },
};

export default {
  Matrix,
  Activations,
  LossFunctions,
  Optimizers,
  Regularization,
  Statistics,
  InformationTheory,
  Complex,
  QuantumState,
  QuantumGates,
  LRSchedulers,
  Metrics,
};

