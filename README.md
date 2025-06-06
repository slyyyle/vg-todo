# 🎮 VG-TODO: A Game-Themed To-Do Quest Log ✅

Track your real-life quests and side-quests with this retro-inspired to-do list application, styled after the classic Nintendo Entertainment System! Manage your tasks, group them into epic quest chains, and (eventually) watch your character progress.

This app is intended to be very low on the "gamification".  Most hard workers need a boost, not a distraction.  

**NOTE: It's up currently to track my progress, and if you want to fork and use the code, and laugh at how much v0, gemini, cursor, and my brain overcomplicated things, you're more than free to do it.  I am balancing dev on this with a personal actually gamified search engine that is fully hostable and private - based on searXNG, as well as a few other apps and websites and really crunched for time so this is getting to a certain state and passed for awhile!**

## Things to Come

*   **Simple Integration:** The whole point of this app, is to be a bridge, with simple json output, that can be used many ways.  I will be developing simple **Obsidian** and **Waybar** integration, which for a capable developer or Linux user is VERY easy from the JSON export.
*   **Multiple Profiles:** Not sure why, but maybe people'd like multiple.  Really this is just going to force development for a "profile creation" screen as right now this is not intended to be a quick pull and is set to the time I in fact started using it.  
*   **More VG Skins:** DID YOU REALLY THINK I'M JUST *NOT* GOING TO USE SNES AND PLAYSTATION 1 CSS STYLE SHEETS WHEN THEY BOTH EXIST?
*   **Actual XP Tracking:** Added - **soon adding Final Fantasy 14-like "Skills" to allocate quest XP and store "completed quest log stats" on a more fun granular level for backtracking!**

![image](https://github.com/user-attachments/assets/e2199e36-156c-4f35-a0cc-3c13c7f6e770)

## ✨ Key Features

*   **Quest & Side Quest Management:** Add, edit, delete, and complete individual tasks.
*   **Quest Chains:** Group related quests into distinct chains with their own info panels.
*   **Objective Tracking:** Break down quests into smaller, checkable objectives.
*   **Authentic NES Styling:** Uses [NES.css](https://nostalgic-css.github.io/NES.css/) for that classic 8-bit look and feel, combined with modern UI practices.
*   **Time Played Counter:** See how long your character has been active since creation! ⏳
*   **Due Date Tracking:** Assign due dates and see relative time remaining or days overdue (with **OVERDUE** styling! 🟥).
*   **Completion Dialogs:** Get satisfying confirmation when completing quests.
*   **Responsive Design:** Adapts to different screen sizes.
*   **Local Data Persistence:** Saves your progress locally using a `data.json` file.

## 🛠️ Tech Stack

This project brings the retro vibes using a *modern (LOL)* tech stack:

*   **Framework:** [Next.js](https://nextjs.org/) 14+ (App Router) 🚀
*   **Language:** [TypeScript](https://www.typescriptlang.org/) 🔷
*   **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) ✨ - _(Using Radix UI & Tailwind CSS)_
*   **Styling:**
    *   [Tailwind CSS](https://tailwindcss.com/) 💨 - For layout and utility styling.
    *   [NES.css](https://nostalgic-css.github.io/NES.css/) 👾 - For the core retro theme.
*   **Date Management:** [date-fns](https://date-fns.org/) 📅
*   **Unique IDs:** [uuid](https://github.com/uuidjs/uuid) 🆔
*   **Data Storage:** Local `data.json` file via Server Actions 💾

*(Based on `components.json` confirming Shadcn/ui style (`default`), UI library (`@radix-ui/react-icons`), and utility (`tailwind-merge`, `clsx`), and `next.config.mjs` being standard for Next.js)*

In other words it was made with v0 and then pulled locally and further developed in Cursor.  Still learning, and laughing.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/slyyyle/vg-todo.git
    cd vg-todo
    ```
2.  **Install dependencies:**
    ```bash
    npm install --legacy-peer-deps
    ```
3.  **Run the development server:**
    ```bash
    npm dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser. ▶️

---

Enjoy managing your quests! 🎉
