export type TellRecord = {
  participant_id: string
  language?: string // Optional: "es", "en", etc.
  sex?: string // Optional: "M" | "F" or other values, can be missing
  age?: number // Optional: Can be missing if participant didn't complete form
  role?: string // Optional: Can be missing if participant didn't complete form
  test_date: string // Required: YYYY-MM-DD format
  composite_1: number // Required: Composite score 1 (Parkinson indicator)
  composite_2: number // Required: Composite score 2 (Alzheimer indicator)
  composite_3: number // Required: Composite score 3 (Overall severity)
}

// Internal representation for composite scores with semantic names
export type CompositeScores = {
  composite1: number // From composite_1
  composite2: number // From composite_2
  composite3: number // From composite_3
}

// Helper type for composite score field keys in TellRecord
export type CompositeScoreField = "composite_1" | "composite_2" | "composite_3"
