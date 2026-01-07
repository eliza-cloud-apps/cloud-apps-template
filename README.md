# Eliza Cloud App Template

This is the official template for building apps on [Eliza Cloud](https://elizacloud.ai).

## Features

- ✅ **Eliza SDK** - Pre-configured API client at `@/lib/eliza`
- ✅ **React Hooks** - Ready-to-use hooks at `@/hooks/use-eliza`
- ✅ **Analytics** - Automatic page view tracking
- ✅ **Credits** - Balance management with `ElizaProvider`
- ✅ **Dark Theme** - Beautiful dark UI with Eliza branding
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS v4** - Modern styling

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with ElizaProvider
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   └── eliza/              # Eliza Cloud components
│       ├── eliza-provider.tsx  # Main provider
│       └── index.ts        # Exports
├── hooks/
│   └── use-eliza.ts        # React hooks for Eliza API
└── lib/
    └── eliza.ts            # Core SDK (DO NOT MODIFY)
```

## Using the SDK

### Chat with AI

```tsx
import { useChat } from '@/hooks/use-eliza';

function ChatComponent() {
  const { send, loading, error } = useChat();
  
  const handleSend = async () => {
    const response = await send([
      { role: 'user', content: 'Hello!' }
    ]);
    console.log(response.choices[0].message.content);
  };
}
```

### Streaming Chat

```tsx
import { useChatStream } from '@/hooks/use-eliza';

function StreamingChat() {
  const { stream, loading } = useChatStream();
  const [content, setContent] = useState('');
  
  const handleStream = async () => {
    for await (const chunk of stream([{ role: 'user', content: 'Hello!' }])) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) setContent(prev => prev + delta);
    }
  };
}
```

### Generate Images

```tsx
import { useImageGeneration } from '@/hooks/use-eliza';

function ImageGen() {
  const { generate, imageUrl, loading } = useImageGeneration();
  
  const handleGenerate = async () => {
    await generate('A beautiful sunset');
  };
  
  return imageUrl ? <img src={imageUrl} alt="Generated" /> : null;
}
```

### Check Credits

```tsx
import { useElizaCredits } from '@/components/eliza';

function CreditCheck() {
  const { balance, hasLowBalance } = useElizaCredits();
  
  if (hasLowBalance) {
    return <p>Low credits! Please top up.</p>;
  }
  
  return <p>Balance: {balance} credits</p>;
}
```

## Environment Variables

The following variables are automatically injected:

- `NEXT_PUBLIC_ELIZA_API_KEY` - Your app's API key
- `NEXT_PUBLIC_ELIZA_API_URL` - Eliza Cloud API URL
- `NEXT_PUBLIC_ELIZA_APP_ID` - Your app's ID

**DO NOT** create API key input fields or configuration screens. Everything is pre-configured.

## Styling

This template uses Tailwind CSS v4. Custom utility classes:

- `.btn-eliza` - Primary orange button
- `.btn-eliza-outline` - Outlined button
- `.card-eliza` - Dark card with border
- `.input-eliza` - Text input field
- `.prose-eliza` - Markdown content styling

Brand colors:
- `eliza-orange` - #FF5800 (primary)
- `eliza-orange-hover` - #E64F00
- `eliza-orange-light` - #FF7A33

## Learn More

- [Eliza Cloud Documentation](https://elizacloud.ai/docs)
- [API Reference](https://elizacloud.ai/docs/api)
- [Examples](https://github.com/elizaos)
