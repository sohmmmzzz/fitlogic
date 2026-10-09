# FitLogic — Fitness Intelligence Platform

## Run
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## What's new in v4
- Real local **account registration and login**.
- Passwords are stored as salted `scrypt` hashes using Node's built-in `crypto` module.
- HTTP-only session cookie for the logged-in user.
- **Logout** button.
- Every account has its own independent nutrition, activity, movement, goals and analytics data.
- Closing/restarting the server keeps accounts and their data in `data/users.json`.
- Unauthenticated users cannot access `/api/state`.
- Theme preference remains local to the browser.
- The app no longer uses one shared `state.json` for all users.

## Main user flow
1. Create an account or log in.
2. Enter age, sex, height, weight, activity level and goal.
3. FitLogic calculates recommended calories and protein automatically.
4. Log food by name + quantity only.
5. Nutrition is calculated automatically.
6. Calories/protein remaining update immediately.
7. FitLogic recommends what to prioritize next.
8. Log workouts and lifestyle movement.
9. Dashboard and analytics update from the user's own data.

## Food examples
- `100g chicken breast`
- `2 eggs`
- `1 banana`
- `3 chapati`
- `80g oats`
- `200ml milk`
- `100g paneer`
- `1 plate poha`

## Important project note
This is a college project. The calorie and protein calculations are simplified fitness estimates, not medical advice.

## Discrete Mathematics concepts
The concepts remain in the implementation rather than being shown as a public tab:
- **Sets:** food/activity collections and user records.
- **Relations:** food-to-meal and activity-to-movement relationships.
- **Functions:** food + quantity → nutrition; activity + duration + intensity → calories burned; profile + goal → daily targets.
- **Logic/predicates:** checks for calorie/protein targets, deficits and goal status.
- **Graph theory:** weighted movement/activity network model.
- **Combinatorics:** meal/activity recommendation combinations.
