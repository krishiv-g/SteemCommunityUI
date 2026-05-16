import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { api } from '@/services';
import type { WalletTransaction, User } from '@/services/api.interface';
import { Wallet, TrendingUp, Zap, ArrowUpRight, ArrowDownRight, Gift, PiggyBank, Coins } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const txIcons = {
  author_reward: Gift,
  curation_reward: TrendingUp,
  transfer: ArrowUpRight,
};

function parseBalance(balanceStr: string): { value: number; symbol: string } {
  const parts = balanceStr.trim().split(' ');
  return { value: parseFloat(parts[0]) || 0, symbol: parts[1] || '' };
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const currentUser = useAppStore(s => s.currentUser);

  useEffect(() => {
    const username = currentUser?.username || 'greenleaf';
    Promise.all([api.getWalletHistory(), api.getUser(username)]).then(([t, u]) => {
      setTransactions(t);
      setUser(u);
    });
  }, [currentUser]);

  return (
    <Layout>
      <div className="reading-width space-y-8">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Wallet
        </h1>

        {user && (
          <>
            {/* Liquid Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <WalletCard
                label="STEEM Balance"
                value={user.balance || `0.000 STEEM`}
                icon={Wallet}
              />
              <WalletCard
                label="SBD Balance"
                value={user.sbdBalanceStr || `0.000 SBD`}
                icon={TrendingUp}
              />
              <WalletCard
                label="Savings STEEM"
                value={user.savingsBalance || `0.000 STEEM`}
                icon={PiggyBank}
              />
              <WalletCard
                label="Savings SBD"
                value={user.savingsSbdBalance || `0.000 SBD`}
                icon={PiggyBank}
              />
            </div>

            {/* Vesting & Power */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <WalletCard
                label="Vesting Shares"
                value={user.vestingShares || '0.000000 VESTS'}
                icon={Zap}
              />
              <WalletCard
                label="Received Vesting"
                value={user.receivedVestingShares || '0.000000 VESTS'}
                icon={ArrowDownRight}
              />
              <WalletCard
                label="Delegated Vesting"
                value={user.delegatedVestingShares || '0.000000 VESTS'}
                icon={ArrowUpRight}
              />
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WalletCard
                label="Reward Vesting Balance"
                value={user.rewardVestingBalance || '0.000000 VESTS'}
                icon={Coins}
              />
              <WalletCard
                label="Reward Vesting STEEM"
                value={user.rewardVestingSteem || '0.000 STEEM'}
                icon={Coins}
              />
            </div>
          </>
        )}

        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Recent Activity</h2>
          {transactions.map(tx => {
            const Icon = txIcons[tx.type];
            return (
              <div key={tx.id} className="flex items-center gap-3 p-4 rounded-lg bg-card shadow-soft">
                <div className="p-2 rounded-full bg-accent/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground capitalize">{tx.type.replace('_', ' ')}</p>
                  {tx.memo && <p className="text-xs text-muted-foreground">{tx.memo}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="font-medium text-sm text-foreground">+{tx.amount} {tx.currency}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

function WalletCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-xl bg-card shadow-soft p-5 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="font-heading text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
