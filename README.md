# Enhanced.AI v2

**Educational Health Optimization Platform for Serious Athletes**

A comprehensive, AI-powered platform designed to provide educational insights into health optimization strategies, compound interactions, and recovery protocols. Built with Next.js 15, TypeScript, and Supabase.

## ⚠️ Important Medical Disclaimers

**This platform provides educational information only and is NOT medical advice.**

- All analysis is for educational purposes
- Always consult qualified healthcare professionals
- Individual responses to interventions vary significantly
- No medical diagnoses or treatment recommendations are provided

## 🚀 Features

### Core Analysis Tools
- **Stack Explorer** - Educational protocol analysis with nutrition impact
- **Side Effects Monitor** - Compound interaction and management analysis
- **Progress Photos** - Body composition analysis with AI insights
- **Recovery Timeline** - Recovery modeling with PCT educational concepts
- **Telehealth Referral** - Professional referral package generation

### Educational Resources
- **Compound Database** - Comprehensive educational compound information
- **Bloodwork Analysis** - Educational marker interpretation
- **Performance Analytics** - Health metric tracking and insights

### Professional Features
- **Doctor-Ready PDFs** - Professional medical summary reports
- **Multi-step Wizards** - Guided analysis workflows
- **AI-Powered Insights** - Grok API integration for educational analysis

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Backend**: Supabase (PostgreSQL, Authentication, RLS)
- **AI Integration**: Grok API (xAI)
- **PDF Generation**: pdf-lib for client-side PDF creation
- **State Management**: React hooks with server components

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Grok API key (xAI)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/ahartman0831/Enhanced.AI-v-2.git
cd Enhanced.AI-v-2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Grok API Configuration
GROK_API_KEY=your_grok_api_key
```

### 4. Supabase Setup
Run the SQL setup script in your Supabase SQL editor:
```sql
-- Copy contents of supabase/setup.sql
```

### 5. Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
├── app/                          # Next.js app directory
│   ├── (auth)/                  # Authentication routes
│   ├── api/                     # API routes
│   ├── compounds/               # Compound database page
│   ├── dashboard/               # Main dashboard
│   ├── progress-photos/         # Photo analysis page
│   ├── recovery-timeline/       # Recovery modeling page
│   ├── side-effects/            # Side effects analysis
│   ├── stack-explorer/          # Protocol analysis
│   └── telehealth-referral/     # Referral package generation
├── components/                  # Reusable components
│   ├── ui/                      # shadcn/ui components
│   └── ...                      # Custom components
├── lib/                         # Utility libraries
│   ├── supabase.ts              # Supabase client
│   ├── grok.ts                  # Grok API integration
│   └── utils.ts                 # Helper functions
├── prompts/                     # AI prompt templates
├── supabase/                    # Database schema & migrations
└── public/                      # Static assets
```

## 🔒 Security & Privacy

- **Row Level Security (RLS)** enabled on all user data tables
- **Authentication** required for all analysis features
- **Data encryption** handled by Supabase
- **No medical data storage** - all analysis is educational only
- **Professional disclaimers** prominently displayed

## 📊 Database Schema

### Core Tables
- `profiles` - User profile information
- `enhanced_protocols` - Analysis results and protocols
- `bloodwork_reports` - Blood test data and analysis
- `photo_reports` - Photo analysis results
- `compounds` - Educational compound database (public)
- `token_usage_log` - AI API usage tracking

### Security
- All user tables have RLS policies
- Users can only access their own data
- Compounds table is public read-only

## 🤖 AI Integration

### Grok API (xAI)
- Educational analysis for all features
- JSON-structured responses
- Token usage logging
- Professional medical summary formatting

### Analysis Types
- Stack protocol optimization
- Side effect mechanism explanation
- Photo composition analysis
- Recovery timeline modeling
- Medical summary formatting

## 📱 Responsive Design

- Mobile-first approach
- Progressive enhancement
- Accessible UI components
- Professional medical aesthetics

## 🔄 Development Workflow

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Git hooks for quality checks

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Pull request to main
```

## 📈 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📜 License

Educational and research purposes only. See individual component licenses.

## ⚠️ Legal & Medical Notice

**This software is for educational purposes only.**

- No medical advice, diagnosis, or treatment is provided
- All users should consult qualified healthcare professionals
- Individual results may vary significantly
- Platform creators are not responsible for user actions

**Always prioritize professional medical care over any educational information.**

## 📞 Support

For technical support or questions:
- Create an issue on GitHub
- Check the documentation
- Review the educational disclaimers

---

**Enhanced.AI v2** - Advancing Health Education Through Technology 🏥🤖