const icsDate = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** Downloads an .ics file so the appointment can be added to any calendar app. */
export function downloadCalendarFile({
  id,
  provider,
  start,
  end,
}: {
  id: string;
  provider: string;
  start: string;
  end: string;
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Koya Clinic//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${id}@koya-clinic`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:Clinic appointment with ${provider}`,
    `DESCRIPTION:Booking reference: ${id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: 'clinic-appointment.ics',
  });
  a.click();
  URL.revokeObjectURL(url);
}
