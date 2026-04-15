import { SearchBar } from "@/components/SearchBar";
import { HeaderCard } from "@/components/HeaderCard";
import { VerdictCard } from "@/components/VerdictCard";
import { SanctionsBanner } from "@/components/SanctionsBanner";
import { CounterpartiesTable } from "@/components/CounterpartiesTable";
import { RecentActivity } from "@/components/RecentActivity";
import { AISummary } from "@/components/AISummary";
import { LoadingState } from "@/components/LoadingState";
import { useWalletAnalysis } from "@/hooks/useWalletAnalysis";
import { EthStatsBar } from "@/components/EthStatsBar";
import { AlertCircle, Shield } from "lucide-react";

export default function App() {
  const { state, analyze } = useWalletAnalysis();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <a
            href="/"
            className="rounded-lg bg-primary p-2 transition-opacity hover:opacity-80"
          >
            <Shield className="h-5 w-5 text-primary-foreground" />
          </a>
          <a href="/" className="transition-opacity hover:opacity-70">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Wallet Intel Brief
            </h1>
            <p className="text-xs text-muted-foreground">
              Ethereum Wallet Intelligence for Compliance
            </p>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Investigate an Ethereum Wallet
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Paste a wallet address to generate a compliance intelligence brief
            with risk assessment, counterparty analysis, and sanctions screening.
          </p>
        </div>

        <div className="mb-4">
          <SearchBar
            onSearch={analyze}
            isLoading={state.status === "loading"}
          />
        </div>

        <div className="mb-8">
          <EthStatsBar />
        </div>

        {state.status === "loading" && <LoadingState step={state.step} />}

        {state.status === "error" && (
          <div className="max-w-3xl mx-auto mt-8">
            <div className="rounded-xl border-2 border-destructive/30 bg-red-50 p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-destructive">
                  Analysis Failed
                </h3>
                <p className="text-sm text-red-700 mt-1">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {state.status === "success" && (
          <div className="max-w-3xl mx-auto space-y-4 mt-4">
            <HeaderCard data={state.data} />

            <VerdictCard verdict={state.data.verdict} />
            <SanctionsBanner isSanctioned={state.data.isSanctioned} />

            <CounterpartiesTable
              counterparties={state.data.counterparties}
            />

            <RecentActivity
              transactions={state.data.recentTransactions}
              walletAddress={state.data.address}
            />

            <AISummary summary={state.data.verdict.summary} />
          </div>
        )}

        {state.status === "idle" && (
          <div className="max-w-3xl mx-auto mt-16 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-muted p-4 mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter an Ethereum wallet address above to begin analysis
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto py-6">
        <p className="text-center text-xs text-muted-foreground">
          Wallet Intel Brief — Data sourced from Alchemy, CoinGecko &amp; OFAC SDN List
        </p>
      </footer>
    </div>
  );
}
