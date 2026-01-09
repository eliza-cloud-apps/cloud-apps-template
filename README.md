# Eliza Cloud App Template

Production-ready template for building AI-powered apps on Eliza Cloud.

## Features

- **🔐 Authentication** - Sign in/out with Eliza Cloud accounts
- **💳 User Credits** - Each user has their own credit balance with Stripe checkout
- **🤖 AI Chat** - Real-time streaming chat with GPT-4o
- **🎯 Agent Chat** - Chat with specific AI characters/agents
- **🖼️ Image Generation** - AI image creation
- **📹 Video Generation** - AI video creation
- **📁 File Upload** - Upload files to cloud storage

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

## Pre-Built SDK

Everything is pre-configured. Just import and use:

### AI Chat (Streaming)

```tsx
'use client';
import { useChatStream } from '@/hooks/use-eliza';

function Chat() {
  const { stream, loading } = useChatStream();
  const [response, setResponse] = useState('');

  const handleSend = async (message: string) => {
    setResponse('');
    for await (const chunk of stream([{ role: 'user', content: message }])) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) setResponse(prev => prev + delta);
    }
  };
}
```

### Agent/Character Chat

```tsx
'use client';
import { useAgentChat } from '@/hooks/use-eliza';

function CharacterChat() {
  const { agent, messages, send, loading } = useAgentChat('agent-id');

  const handleSend = async (text: string) => {
    await send(text); // messages array updates automatically
  };
}
```

### Authentication

```tsx
'use client';
import { useElizaAuth, SignInButton, UserMenu, ProtectedRoute } from '@/components/eliza';

// Sign in button
<SignInButton />

// User menu (when signed in)
<UserMenu />

// Protect pages that require auth
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Use the hook for full control
const { user, isAuthenticated, signIn, signOut } = useElizaAuth();
```

### User Credits

```tsx
'use client';
import { 
  useAppCredits, 
  AppCreditDisplay, 
  PurchaseCreditsButton,
  AppLowBalanceWarning 
} from '@/components/eliza';

// Show balance
<AppCreditDisplay showRefresh />

// Purchase button (opens Stripe checkout)
<PurchaseCreditsButton amount={50} />

// Warning when low
<AppLowBalanceWarning />

// Hook for full control
const { balance, hasLowBalance, purchase } = useAppCredits();
```

### Image Generation

```tsx
'use client';
import { useImageGeneration } from '@/hooks/use-eliza';

function ImageGen() {
  const { generate, loading, result } = useImageGeneration();

  const handleGenerate = async () => {
    await generate('A sunset over mountains');
    // result?.images?.[0]?.url contains the image
  };
}
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with ElizaProvider
│   ├── page.tsx            # Working chat example
│   ├── globals.css         # Tailwind v4 styles
│   ├── auth/
│   │   └── callback/       # OAuth callback (pre-built)
│   └── billing/
│       └── success/        # Purchase success (pre-built)
├── components/
│   └── eliza/              # Pre-built UI components
│       ├── eliza-provider.tsx
│       ├── auth-components.tsx
│       └── credit-components.tsx
├── hooks/
│   ├── use-eliza.ts        # AI hooks (chat, image, agents)
│   ├── use-eliza-auth.ts   # Auth hook
│   └── use-eliza-credits.ts # Credits hook
└── lib/
    ├── eliza.ts            # SDK functions
    ├── eliza-auth.ts       # Auth functions
    └── eliza-credits.ts    # Credits functions
```

## Environment Variables

Set these in your `.env.local`:

```env
NEXT_PUBLIC_ELIZA_API_KEY=your-api-key
NEXT_PUBLIC_ELIZA_APP_ID=your-app-id
NEXT_PUBLIC_ELIZA_API_URL=https://www.elizacloud.ai
```

## CSS Utilities

Pre-built utility classes in `globals.css`:

- `.btn-eliza` - Orange primary button
- `.btn-eliza-outline` - Outlined button
- `.card-eliza` - Dark card with border
- `.input-eliza` - Styled input field
- `.prose-eliza` - Markdown styling

## Important Notes

1. **NEVER remove ElizaProvider from layout.tsx** - It provides auth and credits context
2. **Pre-built pages exist** - Don't recreate `/auth/callback` or `/billing/success`
3. **Use real SDK** - Never create mock/demo implementations
4. **Add 'use client'** - Required for files using hooks or event handlers
5. **Tailwind v4** - Use `@import "tailwindcss";` not v3 syntax

## License

MIT
