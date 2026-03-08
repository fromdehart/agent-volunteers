export type DiffLine = {
  type: "add" | "remove" | "unchanged";
  line: string;
};

export function computeLineDiff(prev: string, next: string): string {
  const prevLines = prev === "" ? [] : prev.split("\n");
  const nextLines = next === "" ? [] : next.split("\n");
  const m = prevLines.length;
  const n = nextLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        prevLines[i - 1] === nextLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && prevLines[i - 1] === nextLines[j - 1]) {
      result.unshift({ type: "unchanged", line: prevLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", line: nextLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", line: prevLines[i - 1] });
      i--;
    }
  }
  return JSON.stringify(result);
}

export function parseDiff(s: string): DiffLine[] {
  try {
    return JSON.parse(s) as DiffLine[];
  } catch {
    return [];
  }
}
