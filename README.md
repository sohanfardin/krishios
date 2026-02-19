# KrishiOS - Smart Farming for Bangladesh 🌾

KrishiOS is a comprehensive, decision-first farming operating system designed to empower Bangladeshi farmers with AI-driven insights, farm management tools, and real-time market data. Our mission is to bridge the digital divide in agriculture and provide farmers with the precision tools they need to optimize yields and maximize profits.

## 🚀 Key Features

- **🤖 AI Smart Advisory**: Instant AI-powered consultation for crop diseases, cultivation techniques, and pest management.
- **📊 Production Tracking**: Comprehensive logs for crops, livestock, and fish farming to monitor growth and productivity.
- **💰 Finance Management**: Track income and expenses specifically tailored for agricultural businesses.
- **📈 Marketplace & Prices**: Real-time market prices across Bangladesh and a dedicated marketplace for farming equipment and products.
- **📅 Smart Scheduler**: Never miss a watering, fertilization, or vaccination date with automated farm tasks.
- **🌦️ Weather Engine**: Hyper-local weather forecasts with actionable farming advice based on conditions.
- **🇧🇩 Multi-language Support**: Fully accessible in both **Bangla** and **English**.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend / Database**: Supabase (PostgreSQL, Edge Functions)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Lucide Icons, Recharts (for data visualization)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/sohanfardin/krishios.git
   cd krishios
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

This project is configured for automated deployment to **GitHub Pages** via GitHub Actions.

1. **Push to Main**: Any push to the `main` branch triggers the deployment workflow.
2. **Settings**: Ensure your repository settings under **Pages** are set to use **GitHub Actions** as the source.
3. **URL**: Your site will be live at `https://sohanfardin.github.io/krishios/`

## 📂 Project Structure

- `src/components`: Reusable UI components.
- `src/pages`: Main application views (Dashboard, Finance, AI, etc.).
- `src/hooks`: Custom React hooks for data fetching and logic.
- `src/contexts`: React Context providers for global state (Auth, Language).
- `supabase/functions`: Backend logic hosted as Supabase Edge Functions.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the farmers of Bangladesh.
