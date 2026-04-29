# Pivot Wealth Portfolio Aggregator

A full-stack web application designed to aggregate, normalize, and visualize fragmented financial data from multiple sources (Account Aggregators, MF Central, and Raw Orders) into a single, cohesive Portfolio Dashboard.

## 🚀 Tech Stack
*   **Frontend:** React.js, Recharts (for data visualization), Lucide-React (icons), Vanilla CSS (Glassmorphism & Custom Dark Theme).
*   **Backend:** Node.js, Express.js.
*   **Architecture:** Service-Oriented Architecture (SOA) handling file parsing, schema normalization, data deduplication, and portfolio math.
*   **Infrastructure:** Docker & Docker Compose.

---

## 🧠 Data Processing Techniques

Because financial data comes from completely different APIs and formats, the backend utilizes several strict techniques to ensure Net Worth is calculated perfectly without double-counting:

### 1. Data Normalization
Each distinct JSON file is parsed and passed through a dedicated normalizer (`normalizeAA`, `normalizeMF`, `normalizeOrder`). This transforms heavily nested and varied JSON structures into a **Single Unified Schema**:
```javascript
{ source, type, isin, folio, transactionId, date, action, quantity, amount, price, assetName, status }
```
*   **Date Normalization:** Dates arrive as Unix Epochs (AA), strict ISO strings (Orders), or standard strings like `18-DEC-2025` (MF). All dates are parsed and hard-normalized to `YYYY-MM-DD` to allow for cross-source matching.
*   **Action Mapping:** All arbitrary terms like `DEBIT`, `CREDIT`, or `p` (purchase) are strictly mapped to `BUY` (Inflow) or `SELL` (Outflow). 

### 2. The Deduplication Engine
Overlapping transactions (e.g., an Order that is also recorded in MF Central) must be deduplicated. We use a **Composite Key Hash + Tie-Breaker** technique:

1.  **The Composite Key:** We generate a unique fingerprint for every transaction:
    `[ISIN]-[Folio]-[NormalizedDate]-[AbsoluteAmount]`
2.  **The Collision Rule:** These keys are inserted into a JavaScript `Map()`. If a key already exists, a collision occurs.
3.  **Source Priority Tie-Breaker:** 
    *   If a collision occurs between **Account Aggregator (AA)** data and **MF Central (MF)** data, the AA record is preserved and the MF record is safely discarded. 
    *   *Why?* Account Aggregator data is pulled directly from Core Banking Systems (FIPs), representing actual settled cash flows, making it the ultimate source of truth.

### 3. Portfolio Calculation
The system aggregates the deduplicated transactions to calculate:
*   **Current Holdings:** Net quantity and investment grouped by ISIN and Folio.
*   **Net Worth & Breakdown:** Summation of all valid `BUY` and `SELL` actions, filtered strictly for transactions marked as `COMPLETED` or `MATCHED` (ignoring pending orders).

---

## 💻 How to Run the Project

This project is fully containerized using Docker, meaning you don't need to manually install Node modules or manage environments.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Quick Start
1.  Open your terminal and navigate to the root directory of the project:
    ```bash
    cd pivot_money
    ```
2.  Build and spin up the containers using Docker Compose:
    ```bash
    docker-compose up --build
    ```
3.  **View the App:** Open your browser and navigate to:
    **[http://localhost:3001](http://localhost:3001)**

### Stopping the Project
To gracefully stop the running servers, simply press `Ctrl + C` in the terminal where Docker is running. 

To run it in detached mode in the future, you can use:
```bash
docker-compose up -d
```
