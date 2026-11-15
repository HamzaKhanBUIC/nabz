# Extras demo (E01 to E06)

How to run the app, test the six extras, and record a short video for the team. The extras live only on the local branch `design/extras`. Nothing is pushed until the team has watched the video and agreed.

## 1. Start both apps

Open two PowerShell windows in the project folder.

API (window 1):

```powershell
npm run dev
```

Web app (window 2). The demo flag adds a "sample session" button to the reaction test so you don't have to tap through it on camera:

```powershell
$env:NEXT_PUBLIC_DEMO="1"; npm --prefix frontend run build; npm --prefix frontend run start
```

Open http://localhost:3000. The API runs on http://localhost:8787.

## 2. Reset before each take

Stop the API, then delete the saved runtime files so Sara starts with a clean day and the environment goes back to Mars transit:

```powershell
Remove-Item data/runtime/*.json
```

Start the API again. Sign out in the browser if a session is still open.

## 3. Crew codes

| Crew | Role | Code |
|---|---|---|
| Sara | Commander (can switch environment) | `4120` |
| Mateo | Pilot | `7316` |
| Elena | Medical officer (can open Crew health) | `2468` |
| Kenji | Engineer | `9053` |

Five wrong codes in a row lock that crew member out for 60 seconds. On camera, show one wrong code only.

## 4. Test checklist (do this once before recording)

- [ ] Signed out, `/hazards` opens and lists five NASA hazards. `/emergency` also opens without a sign-in.
- [ ] A wrong code shows an error. Sara's code `4120` opens Today.
- [ ] Today shows the radiation card: Mars transit, day 120, about 189.6 mSv, 31.6% of the 600 mSv limit, marked as an estimate with sources.
- [ ] Today's checks, Blood pressure, Measure: enter 186 / 122. The card that comes back has a hazard chip (Gravity fields) and a "Who to contact" line for Mars transit.
- [ ] Environment page: switch to ISS and save. The mission line at the top, the card's contact line, the emergency screen and the dose (81.6 mSv) all change. The card's advice stays the same.
- [ ] Switch to Remote Earth: the radiation card says "Not tracked here". Switch back to Mars transit.
- [ ] Real data page shows the OSD-569 blood count trend from the Inspiration4 crew.
- [ ] Privacy: Sara turns on "Share my daily summary with the crew Medical Officer".
- [ ] Sign in as Elena (`2468`): Crew health shows Sara's summary and marks the others "Not shared".
- [ ] Sign in as Mateo (`7316`): Crew health says only the Medical Officer can see it, and the environment page has no switch.

If any box fails, note what you saw and send it to me before recording.

## 5. Video script (about 3 minutes)

Record the browser window at 1280 wide or more. Speak slowly; the team will watch this once.

| # | Time | On screen | Say |
|---|---|---|---|
| 1 | 0:00 | Sign-in page | "This is Nabz with the six extras. First, sign-in. Each crew member has their own code." Type a wrong code, show the error, then sign in as Sara. |
| 2 | 0:20 | Today | "Sara is the Commander, day 120 of a Mars transit. Her data is private to her now." Point at "Today's checks" and the mission line at the top. |
| 3 | 0:35 | Today, radiation card | "This card estimates her mission radiation dose from published NASA-funded measurements, against the 600 millisievert career limit. It says Estimate, and it lists its sources." |
| 4 | 0:55 | Blood pressure, 186 / 122 | "Say she logs a high blood pressure reading." Submit. "The rules pick the card, not the AI. The card now names the NASA hazard it relates to and tells her who to contact from where she is." |
| 5 | 1:20 | Environment page, switch to ISS | "The Commander can change the mission environment." Save, go back to Today. "On the station, the contact line and the dose change. The medical advice doesn't, because thresholds never change with location." |
| 6 | 1:45 | Emergency screen | "Emergency steps open without a sign-in, and they show the same contact line." Switch back to Mars transit afterwards. |
| 7 | 2:00 | Hazards page | "This page lists NASA's five hazards of spaceflight, quoted from NASA, with what Nabz watches for each." |
| 8 | 2:15 | Real data page | "This chart is real astronaut data: blood counts from the Inspiration4 crew, NASA dataset OSD-569." |
| 9 | 2:30 | Privacy page | "Sara chooses whether the Medical Officer sees her daily summary." Turn sharing on. |
| 10 | 2:40 | Sign in as Elena, Crew health | "Elena is the Medical Officer. She sees Sara's summary. Crewmates who haven't shared stay hidden, and every view is logged." |
| 11 | 2:55 | Sign in as Mateo, Crew health | "Mateo isn't the Medical Officer, so this page is closed to him. That's the six extras." |

## 6. Recording on Windows 11

- **Snipping Tool:** press Win+Shift+R, drag over the browser window, press Start. It can record your microphone; turn it on in the toolbar. Stop saves an MP4 you can keep.
- **Xbox Game Bar:** press Win+Alt+R to start and stop recording the active window. Files go to `Videos\Captures`.

Close notifications first (Focus mode), and zoom the browser to 110% so text is readable in the video.

## 7. Note to send with the video

> Hi team, here's a short demo of the proposed changes on my local branch `design/extras`. Nothing is pushed or merged. These are proposals only: if we don't agree, I discard the branch and main stays as it is.
>
> **Before (what's on main now):** daily check-in with the reaction test, blood pressure entry, action cards picked by rules, emergency steps without a sign-in, all offline with synthetic data.
>
> **After (this branch), six features:**
> 1. Sign-in with a crew code per person, so each person's data is private.
> 2. A Real data page with NASA's OSD-569 blood counts from the Inspiration4 crew.
> 3. Every action card names the NASA hazard it relates to, plus a page listing the five hazards.
> 4. A radiation card that estimates mission dose from published rates against NASA's 600 mSv career limit.
> 5. Crew health for the Medical Officer, only for crewmates who chose to share.
> 6. Mission environments (ISS, Moon, Mars transit, Mars surface, remote Earth station). The Commander switches it, and contact lines and the dose change. The medical thresholds never do.
>
> **Plus a design update to the whole app:**
> - The header is one line: mission day, where the crew is, Earth delay and gravity. The crew member is in a small account button.
> - Today starts with "Today's checks": the check-in and blood pressure, each marked Done, Not scored, Due now or Not due, with one button for the next step.
> - Calmer look: neutral dark colours instead of navy, one font, no glows or decorative boxes. Colour is kept for health status and data.
> - The sign-in page says Nabz is a Space Apps project, not affiliated with or endorsed by NASA. We don't use any NASA logo (NASA's brand rules forbid it).
>
> Nothing else is added beyond this list. Every number has a source in research/CHECKS.md, and all tests pass. Please reply with OK for all of it, OK for some (say which), or no.
