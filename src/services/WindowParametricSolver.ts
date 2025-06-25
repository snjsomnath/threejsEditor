// Handles the parametric window dimension algorithm
export interface WindowParametricConfig {
  edgeLength: number;     // Total wall length where windows are placed
  windowWidth: number;    // Default reference window width (used to define min/max range)
  windowHeight: number;   // Fixed window height
  windowSpacing: number;  // Reference spacing between windows (used to define min/max range)
  wwr: number;            // Target window-to-wall ratio
}

export interface WindowParametricResult {
  numWindows: number;     // Number of windows along the wall
  windowWidth: number;    // Calculated width of each window
  spacing: number;        // Spacing between windows
  marginStart: number;    // Margin from the wall edge to the first window (centered layout)
}

export function solveWindowParams(config: WindowParametricConfig): WindowParametricResult | null {
  const { edgeLength, windowWidth, windowHeight, windowSpacing, wwr } = config;

  // Define bounds for variation
  const minWindowWidth = windowWidth * 0.7;
  const maxWindowWidth = windowWidth * 1.5;
  const minSpacing = windowSpacing * 0.5;
  const maxSpacing = windowSpacing * 1.5;

  let bestConfig: WindowParametricResult | null = null;
  let bestScore = -1;

  // Limit the number of windows to avoid too many iterations
  const maxWindows = Math.min(50, Math.floor(edgeLength / minWindowWidth));

  // Try placing 1 up to maxWindows on the wall
  for (let numWindows = 1; numWindows <= maxWindows; numWindows++) {
    const totalMinSpacing = minSpacing * (numWindows - 1);
    if (totalMinSpacing >= edgeLength) break; // No room for windows

    // Calculate max possible window width for current numWindows
    const maxAvailableWidth = edgeLength - totalMinSpacing;
    const windowWidthCandidate = Math.min(maxAvailableWidth / numWindows, maxWindowWidth);
    if (windowWidthCandidate < minWindowWidth) break; // Too narrow, stop trying

    const totalWindowWidth = windowWidthCandidate * numWindows;

    // Calculate spacing to evenly distribute windows along wall
    const spacing = numWindows === 1 ? 0 : (edgeLength - totalWindowWidth) / (numWindows - 1);
    if (spacing < minSpacing || spacing > maxSpacing) continue;

    // Compute actual WWR for this configuration
    const windowArea = windowWidthCandidate * windowHeight * numWindows;
    const wallArea = edgeLength * windowHeight;
    const areaRatio = windowArea / wallArea;

    // Score based on closeness to desired WWR (1 is perfect)
    const score = 1 - Math.abs(areaRatio - wwr);

    // Store if best so far
    if (score > bestScore) {
      bestScore = score;
      bestConfig = {
        numWindows,
        windowWidth: windowWidthCandidate,
        spacing,
        marginStart: (edgeLength - (totalWindowWidth + spacing * (numWindows - 1))) / 2
      };

      // Perfect match, stop searching
      if (score === 1) return bestConfig;
    }
  }

  return bestConfig;
}