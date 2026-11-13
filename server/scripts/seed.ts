// Loads a week of demo slots via POST /reset (which deletes every booking).
// Usage: npm run seed -w server   (set SEED_BASE_URL to seed a deployed server)
const baseUrl = (
  process.env.SEED_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`
).replace(/\/$/, '');
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY is not set');

const PROVIDERS = ['Dr Ade', 'Dr Bello', 'Dr Chika'];
const DAILY_TIMES = ['09:00', '09:30', '10:00', '11:00', '13:30', '14:00', '15:30'];
const DAYS = 7;
const SLOT_MINUTES = 30;

const slots = [];
const today = new Date();
for (let day = 1; day <= DAYS; day++) {
  const date = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + day),
  );
  if (date.getUTCDay() === 0) continue; // closed on Sundays
  for (const [i, time] of DAILY_TIMES.entries()) {
    const [h, m] = time.split(':').map(Number) as [number, number];
    const start = new Date(date);
    start.setUTCHours(h, m);
    const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
    const provider = PROVIDERS[(day + i) % PROVIDERS.length]!;
    slots.push({
      id: `${start.toISOString().slice(0, 10)}-${time.replace(':', '')}`,
      provider,
      start: start.toISOString().replace('.000Z', 'Z'),
      end: end.toISOString().replace('.000Z', 'Z'),
    });
  }
}

const res = await fetch(`${baseUrl}/reset`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
  body: JSON.stringify({ slots }),
});
console.log(`${res.status} ${await res.text()}  (${baseUrl})`);
if (!res.ok) process.exitCode = 1;
