import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/sonner";
import { getMinePositions, hashServerSeed } from "@/utils/minesAlgorithm";
import {
  Bomb,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Gem,
  Hash,
  Loader2,
  RotateCcw,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VerificationResult {
  minePositions: Set<number>;
  minesCount: number;
  hashedSeed: string;
}

// Static tile positions (always 25, order never changes)
const TILE_POSITIONS = [
  "p0",
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
  "p11",
  "p12",
  "p13",
  "p14",
  "p15",
  "p16",
  "p17",
  "p18",
  "p19",
  "p20",
  "p21",
  "p22",
  "p23",
  "p24",
] as const;

const HOW_IT_WORKS_STEPS = [
  "Server generates a random Server Seed and shares its SHA-256 hash before the game.",
  "You provide a Client Seed. The game uses nonce to ensure each round is unique.",
  "HMAC-SHA256(serverSeed, clientSeed:nonce) generates deterministic bytes.",
  "Fisher-Yates shuffle places mines — the result is verifiable and tamper-proof.",
  "After the game, server reveals the unhashed seed. You verify the hash matches.",
] as const;

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied!`);
  });
}

function TileIcon({ isMine }: { isMine: boolean }) {
  if (isMine) {
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Mine"
      >
        <circle cx="14" cy="14" r="8" fill="oklch(0.62 0.22 28 / 0.9)" />
        <circle cx="14" cy="14" r="5" fill="oklch(0.35 0.15 28)" />
        <circle cx="12" cy="12" r="1.5" fill="oklch(0.85 0.08 28 / 0.7)" />
        {/* Spikes */}
        <line
          x1="14"
          y1="3"
          x2="14"
          y2="6"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="14"
          y1="22"
          x2="14"
          y2="25"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="14"
          x2="6"
          y2="14"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="22"
          y1="14"
          x2="25"
          y2="14"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="6.5"
          y1="6.5"
          x2="8.6"
          y2="8.6"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="19.4"
          y1="19.4"
          x2="21.5"
          y2="21.5"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="21.5"
          y1="6.5"
          x2="19.4"
          y2="8.6"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="8.6"
          y1="19.4"
          x2="6.5"
          y2="21.5"
          stroke="oklch(0.62 0.22 28)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Safe gem"
    >
      {/* Diamond gem shape */}
      <polygon
        points="14,4 22,11 14,24 6,11"
        fill="oklch(0.62 0.18 148 / 0.85)"
        stroke="oklch(0.72 0.2 148 / 0.6)"
        strokeWidth="1"
      />
      <polygon
        points="14,4 22,11 14,14 6,11"
        fill="oklch(0.72 0.2 148 / 0.9)"
      />
      <polygon
        points="14,4 18,11 14,14 10,11"
        fill="oklch(0.82 0.15 148 / 0.95)"
      />
      <line
        x1="6"
        y1="11"
        x2="22"
        y2="11"
        stroke="oklch(0.72 0.2 148 / 0.4)"
        strokeWidth="0.8"
      />
    </svg>
  );
}

interface GridTileProps {
  index: number;
  isMine: boolean;
  isRevealed: boolean;
  delay: number;
}

function GridTile({ index, isMine, isRevealed, delay }: GridTileProps) {
  const tileNumber = index + 1;
  const ocid = `result.grid.item.${tileNumber}` as const;

  return (
    <motion.div
      data-ocid={ocid}
      initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
      animate={
        isRevealed
          ? {
              opacity: 1,
              scale: 1,
              rotateY: 0,
              transition: {
                delay,
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }
          : { opacity: 0, scale: 0.5, rotateY: 90 }
      }
      className={`
        relative flex flex-col items-center justify-center
        rounded-md border aspect-square cursor-default select-none
        transition-colors
        ${
          isRevealed
            ? isMine
              ? "bg-mine-tile glow-mine border-mine/50"
              : "bg-safe-tile glow-safe border-safe/40"
            : "bg-muted/30 border-border/40"
        }
      `}
    >
      <span
        className={`absolute top-1 left-1.5 text-[9px] font-mono font-bold leading-none ${
          isRevealed
            ? isMine
              ? "text-mine/80"
              : "text-safe/70"
            : "text-muted-foreground/50"
        }`}
      >
        {tileNumber}
      </span>
      {isRevealed && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: delay + 0.15,
            type: "spring",
            stiffness: 400,
            damping: 15,
          }}
        >
          <TileIcon isMine={isMine} />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function App() {
  const [serverSeed, setServerSeed] = useState(
    "e9a3285cd4b79e33e99b5c7c3e4b2d1f8a6c0e5d9b3f7a2c1e4d8b6a0f5e3c9",
  );
  const [clientSeed, setClientSeed] = useState("myclientseed2024");
  const [nonce, setNonce] = useState(1);
  const [minesCount, setMinesCount] = useState(3);
  const [showSeed, setShowSeed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hashedSeed, setHashedSeed] = useState<string>("");
  const [hashLoading, setHashLoading] = useState(false);
  const hashDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time hash update as user types server seed
  useEffect(() => {
    if (!serverSeed.trim()) {
      setHashedSeed("");
      return;
    }
    setHashLoading(true);
    if (hashDebounceRef.current) clearTimeout(hashDebounceRef.current);
    hashDebounceRef.current = setTimeout(async () => {
      try {
        const hash = await hashServerSeed(serverSeed);
        setHashedSeed(hash);
      } catch {
        setHashedSeed("");
      } finally {
        setHashLoading(false);
      }
    }, 300);
    return () => {
      if (hashDebounceRef.current) clearTimeout(hashDebounceRef.current);
    };
  }, [serverSeed]);

  const handleVerify = useCallback(async () => {
    if (!serverSeed.trim() || !clientSeed.trim()) {
      toast.error("Please enter both Server Seed and Client Seed");
      return;
    }
    if (nonce < 0 || !Number.isInteger(nonce)) {
      toast.error("Nonce must be a non-negative integer");
      return;
    }

    setIsVerifying(true);
    try {
      const [positions, hashed] = await Promise.all([
        getMinePositions(
          serverSeed.trim(),
          clientSeed.trim(),
          nonce,
          minesCount,
        ),
        hashServerSeed(serverSeed.trim()),
      ]);

      setResult({
        minePositions: new Set(positions),
        minesCount,
        hashedSeed: hashed,
      });
      toast.success(
        `${minesCount} mine${minesCount !== 1 ? "s" : ""} located!`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Verification failed. Check inputs and try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [serverSeed, clientSeed, nonce, minesCount]);

  const handleReset = useCallback(() => {
    setServerSeed(
      "e9a3285cd4b79e33e99b5c7c3e4b2d1f8a6c0e5d9b3f7a2c1e4d8b6a0f5e3c9",
    );
    setClientSeed("myclientseed2024");
    setNonce(1);
    setMinesCount(3);
    setResult(null);
    setShowSeed(false);
    toast("Form reset");
  }, []);

  const handleNonceChange = (val: string) => {
    const n = Number.parseInt(val, 10);
    if (!Number.isNaN(n) && n >= 0) setNonce(n);
    else if (val === "") setNonce(0);
  };

  const mineList = result
    ? Array.from(result.minePositions)
        .map((p) => p + 1)
        .sort((a, b) => a - b)
    : [];

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.78 0.16 68) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[300px] opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.62 0.18 148) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 glow-gold">
              <Shield className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gold tracking-tight leading-none">
                Mines Verifier
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono-code">
                Provably Fair Seed Verification
              </p>
            </div>
            <div className="ml-auto">
              <Badge
                variant="outline"
                className="border-gold/30 text-gold-dim text-xs font-mono-code"
              >
                HMAC-SHA256
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Input Card */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-card rounded-xl p-5 sm:p-6 space-y-5"
          aria-label="Verification inputs"
        >
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-4 w-4 text-gold/70" />
            <h2 className="text-sm font-semibold text-gold/90 tracking-wider uppercase">
              Seed Inputs
            </h2>
          </div>

          {/* Server Seed */}
          <div className="space-y-1.5">
            <Label
              htmlFor="server-seed"
              className="text-sm text-muted-foreground font-medium"
            >
              Server Seed
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="server-seed"
                  data-ocid="form.server_seed.input"
                  type={showSeed ? "text" : "password"}
                  value={serverSeed}
                  onChange={(e) => setServerSeed(e.target.value)}
                  placeholder="Enter server seed..."
                  className="font-mono-code text-xs pr-10 bg-input/60 border-border/60 focus:border-gold/50 focus:ring-gold/20"
                  autoComplete="off"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSeed((v) => !v)}
                className="border-border/60 hover:border-gold/40 hover:bg-gold/5 shrink-0"
                aria-label={showSeed ? "Hide seed" : "Show seed"}
                data-ocid="form.server_seed.toggle"
              >
                {showSeed ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(serverSeed, "Server Seed")}
                className="border-border/60 hover:border-gold/40 hover:bg-gold/5 shrink-0"
                aria-label="Copy server seed"
                data-ocid="form.server_seed.secondary_button"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Hashed Server Seed */}
          <motion.div
            data-ocid="result.hashed_seed.panel"
            className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2.5 space-y-1"
            animate={{ opacity: serverSeed ? 1 : 0.5 }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Hashed Server Seed (SHA-256)
              </span>
              {hashLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
              )}
              {hashedSeed && !hashLoading && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(hashedSeed, "Hashed Seed")}
                  className="ml-auto text-muted-foreground hover:text-gold transition-colors"
                  aria-label="Copy hashed seed"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="font-mono-code text-[10px] sm:text-xs text-foreground/70 break-all leading-relaxed">
              {hashedSeed || (
                <span className="text-muted-foreground/40 italic">
                  {serverSeed ? "Computing..." : "Enter a server seed above"}
                </span>
              )}
            </p>
          </motion.div>

          {/* Client Seed */}
          <div className="space-y-1.5">
            <Label
              htmlFor="client-seed"
              className="text-sm text-muted-foreground font-medium"
            >
              Client Seed
            </Label>
            <div className="flex gap-2">
              <Input
                id="client-seed"
                data-ocid="form.client_seed.input"
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                placeholder="Enter client seed..."
                className="font-mono-code text-xs bg-input/60 border-border/60 focus:border-gold/50 focus:ring-gold/20"
                autoComplete="off"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(clientSeed, "Client Seed")}
                className="border-border/60 hover:border-gold/40 hover:bg-gold/5 shrink-0"
                aria-label="Copy client seed"
                data-ocid="form.client_seed.secondary_button"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Nonce + Mines Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nonce */}
            <div className="space-y-1.5">
              <Label
                htmlFor="nonce"
                className="text-sm text-muted-foreground font-medium"
              >
                Nonce
              </Label>
              <Input
                id="nonce"
                data-ocid="form.nonce.input"
                type="number"
                min={0}
                value={nonce}
                onChange={(e) => handleNonceChange(e.target.value)}
                className="font-mono-code text-sm bg-input/60 border-border/60 focus:border-gold/50 focus:ring-gold/20"
              />
            </div>

            {/* Mines Count */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground font-medium">
                Mines Count:{" "}
                <span className="text-gold font-bold font-mono-code">
                  {minesCount}
                </span>
              </Label>
              <Select
                value={String(minesCount)}
                onValueChange={(v) => setMinesCount(Number.parseInt(v, 10))}
                data-ocid="form.mines_count.select"
              >
                <SelectTrigger
                  className="bg-input/60 border-border/60 focus:border-gold/50 font-mono-code text-sm"
                  data-ocid="form.mines_count.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <SelectItem
                      key={n}
                      value={String(n)}
                      className="font-mono-code text-sm"
                    >
                      {n} {n === 1 ? "mine" : "mines"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mines slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono-code">
              <span>1</span>
              <span>12</span>
              <span>24</span>
            </div>
            <Slider
              min={1}
              max={24}
              step={1}
              value={[minesCount]}
              onValueChange={([v]) => setMinesCount(v)}
              className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold/50 [&_.relative]:before:bg-gold/30"
              aria-label="Mines count slider"
            />
          </div>

          <Separator className="bg-border/40" />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              data-ocid="form.verify.primary_button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex-1 bg-gold/90 hover:bg-gold text-primary-foreground font-bold tracking-wide shadow-gold-sm hover:shadow-gold-md transition-all"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify
                </>
              )}
            </Button>
            <Button
              data-ocid="form.reset.secondary_button"
              variant="outline"
              onClick={handleReset}
              className="border-border/60 hover:border-gold/30 hover:bg-gold/5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </motion.section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-5"
            >
              {/* Grid */}
              <section
                data-ocid="result.grid.panel"
                className="glass-card rounded-xl p-5 sm:p-6"
                aria-label="Mine positions grid"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Bomb className="h-4 w-4 text-mine/80" />
                  <h2 className="text-sm font-semibold text-foreground/80 tracking-wider uppercase">
                    Mine Positions
                  </h2>
                  <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-mine/50 border border-mine/40 inline-block" />
                      Mine
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-safe/40 border border-safe/30 inline-block" />
                      Safe
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                  {TILE_POSITIONS.map((tileKey, i) => (
                    <GridTile
                      key={tileKey}
                      index={i}
                      isMine={result.minePositions.has(i)}
                      isRevealed={true}
                      delay={i * 0.04}
                    />
                  ))}
                </div>
              </section>

              {/* Summary */}
              <motion.section
                data-ocid="result.summary.panel"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="glass-card rounded-xl p-5 sm:p-6"
                aria-label="Result summary"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Gem className="h-4 w-4 text-gold/80" />
                  <h2 className="text-sm font-semibold text-foreground/80 tracking-wider uppercase">
                    Summary
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-mine font-mono-code">
                      {result.minesCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.minesCount === 1 ? "Mine" : "Mines"} Placed
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-safe font-mono-code">
                      {25 - result.minesCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Safe Tiles
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 border border-border/40 px-4 py-3 text-center">
                    <div className="text-2xl font-bold text-gold font-mono-code">
                      25
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total Tiles
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <ChevronRight className="h-3 w-3 text-mine/60" />
                    <span className="uppercase tracking-wider font-medium">
                      Mine tile numbers
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mineList.map((tileNum, idx) => (
                      <motion.span
                        key={tileNum}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.35 + idx * 0.05,
                          type: "spring",
                          stiffness: 400,
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-mine/15 border border-mine/40 text-mine text-sm font-bold font-mono-code glow-mine"
                      >
                        {tileNum}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border/40 my-4" />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Verified Hashed Server Seed
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(result.hashedSeed, "Hashed Seed")
                      }
                      className="ml-auto text-muted-foreground hover:text-gold transition-colors"
                      aria-label="Copy hashed seed"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="font-mono-code text-[10px] sm:text-xs text-foreground/60 break-all leading-relaxed">
                    {result.hashedSeed}
                  </p>
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works info */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="glass-card rounded-xl p-5 sm:p-6"
          aria-label="How provably fair works"
        >
          <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase mb-3">
            How Provably Fair Works
          </h2>
          <ol className="space-y-2 text-xs text-muted-foreground">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={step.slice(0, 30)} className="flex gap-2.5 items-start">
                <span className="shrink-0 w-4 h-4 rounded-full bg-gold/15 border border-gold/20 flex items-center justify-center text-[9px] font-bold text-gold/80 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/50 hover:text-gold/80 transition-colors"
          >
            caffeine.ai
          </a>
        </div>
      </footer>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.18 0.015 260)",
            border: "1px solid oklch(0.25 0.015 260)",
            color: "oklch(0.95 0.01 90)",
          },
        }}
      />
    </div>
  );
}
