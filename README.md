# Perception vs Reality · Research Dashboard

A vibe-coding interactive, browser-based dashboard for comparing **self-reported** and **objective** social media use data. Upload your dataset, review AI-assisted column mapping, handle missing values, and explore bias patterns across participants and demographic groups — all without any backend infrastructure.

---

## Files

| File | Description |
|------|-------------|
| `platform_local.html` | The dashboard interface. Open this in your browser. |
| `server.js` | Local proxy server. Required to use AI features via the Anthropic API. |

---

## Part 1 — Setting Up the API (Required for AI Features)

The dashboard uses Claude (Anthropic's AI) for three things: automatic column mapping in Flexible Mode, the chat-based data transformation interface, and AI-generated interpretations in the dashboard. These features require an Anthropic API key and a local proxy server.

### Step 1 — Get an API Key

1. Go to [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Copy the full key immediately — it is only shown once

### Step 2 — Install Node.js

If you do not have Node.js installed, download the LTS version from [https://nodejs.org](https://nodejs.org). After installation, confirm it works by running `node -v` in your terminal.

### Step 3 — Configure `server.js`

Open `server.js` in any text editor and update the two configuration lines at the top:

```js
const ANTHROPIC_API_KEY = 'sk-ant-YOUR_KEY_HERE';   // paste your API key here
const MODEL             = 'claude-sonnet-4-5';       // change if needed (see below)
```

**Finding your available model name**

Go to [https://console.anthropic.com/settings/limits](https://console.anthropic.com/settings/limits) to see which models are active on your account. Then check [https://docs.anthropic.com/en/docs/about-claude/models](https://docs.anthropic.com/en/docs/about-claude/models) for the exact model string to use. Common options:

| Model string | Notes |
|---|---|
| `claude-sonnet-4-5` | Recommended — good balance of speed and quality |
| `claude-haiku-4-5-20251001` | Faster and cheaper |
| `claude-opus-4-5` | Most capable, slower |

### Step 4 — Start the Proxy Server

Open your terminal, navigate to the folder containing `server.js`, and run:

```bash
node server.js
```

You should see:
```
  Proxy running at http://localhost:3001
  Open platform_local.html in your browser.
```

Keep this terminal window open while using the dashboard. Press `Ctrl + C` to stop it when done.

### Step 5 — Open the Dashboard

Open `platform_local.html` directly in your browser (Chrome or Firefox recommended). No additional setup is needed.

---

### Troubleshooting — API Setup

**`401 Invalid authentication credentials`**
Your API key is incorrect. Check that it starts with `sk-ant-`, has no extra spaces or line breaks, and that the key is still active at [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

**`404 model not found`**
The model string in `server.js` is not available on your account. Update the `MODEL` variable to a model listed as Active on your account's limits page.

**`429 Too many requests`**
You have hit the rate limit. Wait a moment and try again. Tier 1 accounts are limited to 50 requests per minute.

**AI features do nothing / no response**
Make sure the proxy server is still running in your terminal. If you closed the terminal, re-run `node server.js`.

**`cd: too many arguments` in terminal**
You pasted too much text after `cd`. The command should be `cd` followed by a single folder path only — for example, `cd ~/Desktop/my-folder`.

---

## Part 2 — Using the Dashboard

### Uploading Your Data

When you open the dashboard, you will see two upload modes. Both accept a **single CSV file only**. Choose the mode that matches your dataset.

---

### Standard Mode

Use this when your CSV file already uses the exact column names the dashboard expects. This is the fastest path — no AI mapping step is needed.

> **Important:** Column names are case-sensitive and must match exactly as listed below. The dashboard will reject the file if any required column is missing or spelled differently.

#### Required Columns

| Column name | Description |
|-------------|-------------|
| `participant_id` | Unique identifier per participant |
| `day` | Day indicator — accepts strings (`monday`), integers (`1`, `2`, `3`), or dates (`2024-01-15`) |
| `subjective_time` | Self-reported screen time, in minutes (must be numeric) |
| `objective_time` | Objective screen time, in minutes (must be numeric) |
| `subjective_pickups` | Self-reported number of phone pickups (must be numeric) |
| `objective_pickups` | Objective number of phone pickups (must be numeric) |

#### Optional Demographic Columns

The following column names are recognized as demographic variables and will enable the Demographic tab in the dashboard. Names must match exactly — including underscores and lowercase:

`gender` · `age` · `ethnicity` · `education` · `income` · `occupation` · `country` · `language` · `marital_status`

#### Optional Extension Columns

Any additional numeric columns not listed above are automatically detected and displayed as trend charts in the dashboard. These can use any column name.

#### Steps

1. Select **Standard Mode**
2. Upload your CSV file
3. Click **Analyse & Continue**
4. If the file passes validation, you will proceed directly to the **Missing Value** screen

#### Troubleshooting — Standard Mode

- If you see a validation error, check that all six required columns are present and spelled exactly as shown above (case-sensitive, underscores not spaces).
- Time and pickup values must be numeric. Non-numeric values in those columns will cause errors.
- Only a single CSV file is supported.

---

### Flexible Mode

Use this when your CSV file uses different column names, or when your data needs transformation before it can be mapped to the required roles. Claude analyzes your data structure, proposes a column mapping, and helps you reshape the data through a chat interface.

**Requirements:**
- The dataset must contain at least one self-reported measure and one corresponding objective measure
- A participant identifier column
- A time or day column

> **Note:** Only a single CSV file is supported.

#### Steps

##### Step 1 — Upload

Select **Flexible Mode** and upload your CSV file.

##### Step 2 — Review Data Mapping

Claude analyzes your column names and the first few rows of data, then proposes a mapping to the required dashboard roles. You will see:

**Core Variable Mapping**
A table showing which of your columns have been mapped to each required role, with a confidence level (High / Medium / Low) for each. You can change any mapping using the dropdown selectors. If your time columns are in hours or seconds rather than minutes, select the correct unit — the dashboard will convert them automatically.

**Other Columns**
Remaining columns are classified into three groups:
- **Demographic** — variables used to group participants in the Demographic tab
- **Extension** — additional numeric variables displayed as trend charts
- **Ignored** — columns excluded from the dashboard

Click a chip to select it, then use the move buttons to reassign it to a different group. Shift+click to select a range.

**Data Transforms**
Use the chat panel on the right to request data transformations before the dashboard is generated. The following transform types are supported:

| Transform | What it does | Example prompt |
|-----------|-------------|----------------|
| **Combine** | Creates a new variable from two or more columns using an arithmetic expression | *"Combine Q21_1 (hours) and Q21_2 (minutes) into subjective_time"* |
| **Recode** | Maps existing values to new labels | *"Recode gender: 1 = male, 2 = female, 3 = other"* |
| **Reverse score** | Inverts a numeric scale | *"Reverse score Q25_3 and Q25_4 on a 1–7 scale"* |
| **Lookup / Flag** | Collapses multiple binary flag columns (e.g. one column per ethnicity category) into a single categorical variable | *"Combine eth_white, eth_black, eth_asian into one ethnicity column"* |
| **Filter rows** | Keeps only rows matching a condition, discarding the rest | *"Keep only rows where finished equals 1"* |
| **Reclassify** | Moves a column between Demographic, Extension, and Ignored groups | *"Move wellbeing to Extension"* |

Transforms are applied in order and can be stacked. All changes are reflected in the data preview before the dashboard is generated.

**Preview Data**
Click **👁 Preview Data** at any time to see the first 20 rows of your data after all transforms have been applied. Core variable columns are highlighted. Use this to confirm that your mappings and transforms are correct before proceeding.

Once you are satisfied, click **Confirm & Next Step**.

#### Troubleshooting — Flexible Mode

- If Claude cannot find a compatible structure, it will show a "Dataset not compatible" message. This means it could not identify a self-reported and objective measure pair, a participant identifier, or a time/day variable. Check that your dataset contains these elements.
- If the AI chat does not respond, the proxy server may have stopped. Check your terminal and re-run `node server.js` if needed.
- Transforms are applied in order. If a result looks wrong, use Preview Data to inspect the output, then ask Claude to adjust or remove the transform.
- The chat retains the last 8 turns of context. Be specific in each message rather than referring vaguely to earlier steps.
- For the **Lookup / Flag** transform, always specify the exact source column names, the label for each column, and what value means the flag is active (e.g. `1` for numeric flags, `"yes"` for string flags).

---

### Step 3 — Missing Value Handling

Before the dashboard is generated, you review data completeness and set exclusion criteria.

**Completeness Heatmap**
A grid showing each participant against each core variable. Each cell shows how many days of valid (non-null) data that participant has. Darker cells mean more complete data.

**Exclusion Criteria**
Select one or more variables and set a minimum completeness threshold using the sliders. A participant is excluded if they fall below the threshold.

- **AND logic** — exclude a participant if they fail *any* of the selected criteria
- **OR logic** — exclude a participant only if they fail *all* of the selected criteria

**Treatment of Excluded Participants**
Choose one of three options:

| Option | Effect |
|--------|--------|
| Remove | Excluded participants are permanently removed. The dashboard shows a single clean dataset. |
| Split view | Both versions are available. A toggle in the navigation bar lets you switch between Full dataset and Selected cases only. |
| No exclusion | All participants are included regardless of missingness. Criteria above are ignored. |

**Decision Summary**
A plain-text description of your exclusion decisions is generated automatically and can be copied directly into a Methods section.

Click **Generate Dashboard** when ready.

---

### The Dashboard

The dashboard has up to three tabs depending on your data.

#### Overview Tab

Aggregate patterns across all participants and all days.

- **Summary statistics** — average screen time estimation error, average pickup estimation error, total observations, and number of participants
- **Screen time chart** — average self-reported vs objective screen time across days, with an error percentage bar chart below
- **Pickups chart** — same layout for pickup counts
- **Extension variable charts** — one chart per additional numeric column, if present
- **AI Interpretation** — click **Generate** for a 3–5 sentence plain-prose summary of the overall bias patterns in the dataset

#### Individual Tab

Select a participant from the dropdown to see their data in detail.

- **Summary statistics** — that participant's average errors and total observations
- **Day strip** — click any day to see a detailed breakdown for that day, including extension variable values
- **Screen time and pickups charts** — same dual-panel layout as Overview, scoped to this participant
- **AI Interpretation** — click **Generate** for an interpretation of this participant's individual bias patterns

#### Demographic Tab

Appears only when demographic columns are present in your data.

- Select a demographic variable from the dropdown to group participants
- Summary cards show the average screen time estimation error per group
- Side-by-side charts compare the time series and bias patterns across groups
- **AI Interpretation** — click **Generate** for a comparison of group differences

---

### Error Color Coding

Throughout the dashboard, estimation error is color-coded consistently:

| Color | Meaning |
|-------|---------|
| 🔴 Red | Overestimation (self-reported > objective) |
| 🔵 Blue | Underestimation (self-reported < objective) |
| 🟢 Green | Accurate (within ±5%) |

---

### Resetting

Click **↩ New file** in the navigation bar to return to the upload screen and start over with a new dataset.
