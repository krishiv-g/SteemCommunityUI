import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAppStore } from '@/store/useAppStore';
import {
  isKeychainAvailable,
  generateLoginMessage,
  signWithKeychain,
  verifyPostingKey,
  registerLogin,
} from '@/services/steem.auth';
import { storePostingKey } from '@/services/steem.broadcast';
import { KeyRound, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { HempLogo } from '@/components/HempLogo';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, login } = useAppStore();
  const [username, setUsername] = useState('');
  const [postingKey, setPostingKey] = useState('');
  const [useKeychain, setUseKeychain] = useState(false);
  const [keychainDetected, setKeychainDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Keychain may inject after page load, check with a delay
    const check = () => {
      const available = isKeychainAvailable();
      setKeychainDetected(available);
      if (available) setUseKeychain(true);
    };
    check();
    const timer = setTimeout(check, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setError('');
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setError('Please enter your Steem username');
      return;
    }

    if (!useKeychain && !postingKey.trim()) {
      setError('Please enter your posting private key');
      return;
    }

    setLoading(true);

    try {
      if (useKeychain) {
        // Sign message with Steem Keychain
        const message = generateLoginMessage();
        await signWithKeychain(trimmedUsername, message);
      } else {
        // Verify posting key matches the account
        const valid = await verifyPostingKey(trimmedUsername, postingKey.trim());
        if (!valid) {
          setError('Invalid posting key for this account');
          setLoading(false);
          return;
        }
      }

      // Register login in Supabase and get JWT
      const jwt = await registerLogin(trimmedUsername);

      // Store posting key in session for direct broadcasting
      if (!useKeychain) {
        storePostingKey(postingKey.trim());
      }

      login(trimmedUsername, useKeychain ? 'keychain' : 'posting_key', jwt);
      toast.success(`Welcome, @${trimmedUsername}!`);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout sidebar={false}>
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <HempLogo className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Sign in to Hempire
            </h1>
            <p className="text-muted-foreground mt-2">
              Use your Steem account to sign in
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">
                Steem Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9.-]/gi, ''))}
                  placeholder="yourusername"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            {/* Login method toggle */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Sign-in Method</p>

              {/* Keychain option */}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  useKeychain
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                } ${!keychainDetected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="loginMethod"
                  checked={useKeychain}
                  onChange={() => setUseKeychain(true)}
                  disabled={!keychainDetected || loading}
                  className="accent-primary"
                />
                <Shield className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Steem Keychain</p>
                  <p className="text-xs text-muted-foreground">
                    {keychainDetected ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Extension detected
                      </span>
                    ) : (
                      'Extension not detected'
                    )}
                  </p>
                </div>
              </label>

              {/* Posting key option */}
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  !useKeychain
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <input
                  type="radio"
                  name="loginMethod"
                  checked={!useKeychain}
                  onChange={() => setUseKeychain(false)}
                  disabled={loading}
                  className="accent-primary"
                />
                <KeyRound className="h-5 w-5 text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Posting Private Key</p>
                  <p className="text-xs text-muted-foreground">
                    Key stays in your browser, never sent to any server
                  </p>
                </div>
              </label>
            </div>

            {/* Posting key input */}
            {!useKeychain && (
              <div>
                <label htmlFor="postingKey" className="block text-sm font-medium text-foreground mb-1.5">
                  Posting Private Key
                </label>
                <input
                  id="postingKey"
                  type="password"
                  value={postingKey}
                  onChange={(e) => setPostingKey(e.target.value)}
                  placeholder="5K..."
                  className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Your key is verified locally and never leaves your browser
                </p>
              </div>
            )}

            {/* Signature message info */}
            <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Signature Message:</span>{' '}
                "Login to World Of Xpilar [timestamp]"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                A timestamped message will be signed to verify your identity.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  {useKeychain ? <Shield className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                  Sign In
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have a Steem account?{' '}
            <a
              href="https://steemit.com/pick_account"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
