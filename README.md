🚀 ConnectUp
Swipe. Match. Connect. Make new friends at IIT Ropar!
📝 Introduction
ConnectUp is a Tinder-inspired social networking application designed specifically for the IIT Ropar campus community. The primary goal is to help students, especially first-years, discover and connect with peers who share similar interests, hobbies, and goals in a friendly, non-dating-focused environment.

This project provides a modern, responsive, and real-time platform for making new friends and strengthening the campus community.

✨ How It Works: Features & Technology
This application is built as a modern, full-stack app, but with a "Backend-as-a-Service" model which allows for rapid development and powerful features out-of-the-box.

1. Technology Stack
Frontend: Vite + React (TypeScript)

Styling: Tailwind CSS & shadcn/ui

Backend & Database: Supabase

2. Core Features (The "Working" Part)
Real-time Authentication: Secure, instant user signup and login handled by Supabase Auth.

Cloud Database: All user data, profiles, and messages are stored in a Supabase (Postgres) cloud database.

Profile Setup: Users can create and update their profiles with essential details like their name, branch, year, a personal bio, and hobbies.

Real-time Chat: Once users are matched, they can engage in real-time chat, powered by Supabase Realtime subscriptions. This functionality also supports read receipts and typing indicators.

Real-time Video Chat: Matched users can initiate real-time video calls, built using WebRTC and managed through Supabase's realtime channels.

🚀 How to Boot It Up (Procedure)
To get this project running locally on your machine, you will need to connect it to your own free Supabase project.

Step 1: Clone the Repository
First, clone this repo to your local machine:

Bash

git clone <your-github-repo-url>
cd connect-up-iitr-main
Step 2: Install Dependencies
Install all the required packages using npm:

Bash

npm install
Step 3: Set Up Your Supabase Backend
This is the most important step. The project needs to connect to a Supabase backend to store data.

Go to supabase.com and sign up.

Create a New Project.

After your project is created, go to Project Settings > API.

You will find your Project URL and your anon (public) key.

Step 4: Create the .env File
In the root of your project folder, create a new file named .env.

Copy and paste the keys from Step 3 into this file. It must look exactly like this:

VITE_SUPABASE_URL=https_://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-long-publishable-key>
Step 5: Run the Project
Now you are ready to start the app!

Bash

npm run dev
This will launch the website on a local server (usually http://localhost:5173). You can now open this URL in your browser, and the app will be fully functional, saving all its data to your new Supabase project.
