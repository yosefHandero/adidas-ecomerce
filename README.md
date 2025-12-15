# OutfitBuilder

A clean, one-page AI outfit recommendation experience. Describe items you own or want to style, and get personalized outfit suggestions with visual mannequin representation.

## 🚀 Features

- **AI-Powered Outfit Generation**: Get 3 style variations (Minimal, Street, Elevated) based on your items
- **Visual Mannequin**: Interactive unisex mannequin with animations
- **Smart Input**: Text descriptions + optional image uploads
- **Style Controls**: Occasion, vibe, fit, weather, and budget preferences
- **No Auth Required**: Start styling immediately

## 📋 Prerequisites

- Node.js 18+
- API key for AI service (OpenAI, Anthropic, etc.)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# AI Service (choose one)
OPENAI_API_KEY="your-openai-key"  # Default - recommended
# OR
ANTHROPIC_API_KEY="your-anthropic-key"
# OR
GROQ_API_KEY="your-groq-key"

# Optional: Specify provider (defaults to openai)
AI_PROVIDER="openai"  # Options: openai, anthropic, groq

# Image Search (optional - for outfit inspiration images)
UNSPLASH_ACCESS_KEY="your-unsplash-key"  # Get free at unsplash.com/developers
# OR
PEXELS_API_KEY="your-pexels-key"  # Get free at pexels.com/api
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/
│   ├── outfit/
│   │   └── page.tsx        # Main outfit builder page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── OutfitInputPanel.tsx
│   ├── MannequinStage.tsx
│   ├── OutfitResults.tsx
│   └── ItemChip.tsx
└── lib/
    ├── ai.ts              # AI prompt + parsing
    └── types.ts
```

## 🎨 How It Works

1. **Add Items**: Describe clothing items you own or want to style (text + optional images)
2. **Set Preferences**: Choose occasion, vibe, fit, weather, and budget
3. **Generate**: AI creates 3 outfit variations with complete styling details
4. **Visualize**: See items positioned on an animated mannequin
5. **Refine**: Click items to swap or adjust

## 📚 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **AI**: OpenAI / Anthropic API

## 📝 License

MIT
