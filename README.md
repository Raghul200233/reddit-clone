# 🐘 Reddit Clone - Full Stack Web Application

A production-ready Reddit clone built with Next.js, PostgreSQL, and Tailwind CSS. This application replicates core Reddit functionality including communities, posts, voting, comments, and user authentication.

![Reddit Clone Screenshot](https://via.placeholder.com/800x400?text=Reddit+Clone+Screenshot)

## 🚀 Live Demo

**[View Live Demo](https://reddit-ui-clone-eta.vercel.app)**

Test credentials:
- Email: `tech@example.com`
- Password: `password123`

## ✨ Features

### Core Features
- ✅ **User Authentication** - Sign up, login, logout with secure session management
- ✅ **Communities (Subreddits)** - Create and browse communities
- ✅ **Posts** - Create text, image, and link posts
- ✅ **Voting System** - Upvote/downvote posts with real-time updates
- ✅ **Comments** - Add and view comments on posts
- ✅ **Sorting** - Sort posts by latest or popularity

### UI/UX Features
- 🎨 Clean, minimal Reddit-style layout
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🔍 Search communities with real-time results
- ⚡ Skeleton loaders for smooth loading experience
- 🎯 Clear CTA buttons for all actions
- 🌈 Reddit-inspired color scheme (#FF4500)

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with SSR/CSR |
| Tailwind CSS | Styling and responsive design |
| React Hot Toast | Toast notifications |
| Timeago.js | Relative timestamps |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless API endpoints |
| PostgreSQL | Relational database |
| Supabase | Cloud database hosting |
| NextAuth.js | Authentication |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend + API hosting |
| Supabase | Database hosting |

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Supabase account recommended)

## 🏗️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/reddit-clone.git
cd reddit-clone
2. Install dependencies
bash
npm install
# or
yarn install
3. Set up environment variables
Create a .env.local file in the root directory:

env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxxx:password@db.xxxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Supabase Client (for file uploads)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
4. Set up the database
bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database with sample data
npm run seed
# or
node prisma/seed.js
5. Run the development server
bash
npm run dev
# or
yarn dev
Open http://localhost:3000 to view the app.

📁 Project Structure
text
reddit-clone/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Seed script
├── public/
│   └── uploads/           # Uploaded images (local)
├── src/
│   ├── components/        # React components
│   │   ├── CommentSection.js
│   │   ├── Layout.js
│   │   ├── Navbar.js
│   │   ├── PostCard.js
│   │   ├── SearchBar.js
│   │   ├── SkeletonLoader.js
│   │   └── VoteButtons.js
│   ├── lib/
│   │   └── db.js          # Database connection
│   ├── pages/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication
│   │   │   ├── comments/  # Comments CRUD
│   │   │   ├── communities/ # Communities CRUD
│   │   │   ├── posts/     # Posts CRUD
│   │   │   └── votes/     # Voting system
│   │   ├── r/[slug].js    # Community page
│   │   ├── posts/[id].js  # Post detail page
│   │   ├── _app.js
│   │   ├── index.js       # Homepage
│   │   ├── login.js
│   │   ├── signup.js
│   │   ├── create-community.js
│   │   └── search.js
│   └── styles/
│       └── globals.css    # Global styles
├── .env.local             # Environment variables
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind config
├── vercel.json            # Vercel deployment config
└── package.json
🔌 API Endpoints
Method	Endpoint	Description
GET	/api/posts	Fetch all posts (latest/popular)
POST	/api/posts	Create a new post
GET	/api/posts/[id]	Fetch single post
GET	/api/communities	Fetch all communities
POST	/api/communities	Create a community
GET	/api/communities/search?q=	Search communities
POST	/api/votes	Upvote/downvote a post
GET	/api/comments?postId=	Fetch comments for a post
POST	/api/comments	Add a comment
🚀 Deployment
Deploy to Vercel
Push your code to GitHub

Go to Vercel

Click "Add New" → "Project"

Import your GitHub repository

Add environment variables (same as .env.local)

Click "Deploy"

Environment Variables for Production
env
DATABASE_URL=your_supabase_pooled_url
DIRECT_URL=your_supabase_direct_url
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_key
🧪 Testing
Test Accounts (after seeding)
All passwords: password123

Email	Username
tech@example.com	tech_guru
code@example.com	code_master
web@example.com	web_wizard
dev@example.com	dev_enthusiast
startup@example.com	startup_founder
API Testing
bash
# Test posts endpoint
curl https://your-domain.vercel.app/api/posts?sort=latest

# Test communities endpoint
curl https://your-domain.vercel.app/api/communities

# Test search
curl https://your-domain.vercel.app/api/communities/search?q=tech
📊 Database Schema
prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  username  String    @unique
  password  String
  posts     Post[]
  comments  Comment[]
  votes     Vote[]
}

model Community {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  posts       Post[]
}

model Post {
  id          String    @id @default(cuid())
  title       String
  content     String
  imageUrl    String?
  linkUrl     String?
  type        String    @default("text")
  community   Community @relation(fields: [communityId], references: [id])
  communityId String
  author      User      @relation(fields: [authorId], references: [id])
  authorId    String
  comments    Comment[]
  votes       Vote[]
  createdAt   DateTime  @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

model Vote {
  id        String   @id @default(cuid())
  type      String   // "UP" or "DOWN"
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  
  @@unique([userId, postId])
}
🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/amazing)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing)

Open a Pull Request

📝 License
This project is MIT licensed.

🙏 Acknowledgments
Next.js - React framework

Tailwind CSS - Styling

Supabase - Database hosting

Vercel - Deployment platform

NextAuth.js - Authentication

📧 Contact
Your Name - @yourtwitter - your.email@example.com

Project Link: https://github.com/yourusername/reddit-clone

⚠️ Troubleshooting
Database connection issues
Verify your Supabase instance is active

Check that DATABASE_URL is correct in .env.local

Run npx prisma db push to sync schema

Build errors on Vercel
Ensure all environment variables are set in Vercel dashboard

Check that NEXTAUTH_SECRET is properly configured

Verify Node.js version is 18+

401 Unauthorized errors
Clear browser cookies and login again

Check that NEXTAUTH_SECRET matches across environments

Built with ❤️ using Next.js and Tailwind CSS