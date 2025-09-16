// Consultar disponibilidad
async function fetchBusy(workerId, fromISO, toISO){
  const url = new URL('http://localhost:3001/api/availability');
  url.searchParams.set('workerId', workerId);
  url.searchParams.set('timeMin', fromISO);
  url.searchParams.set('timeMax', toISO);
  const r = await fetch(url); return r.json();
}

// Crear reserva
async function book(workerId, startISO, endISO, nombre, telefono){
  const r = await fetch('http://localhost:3001/api/book', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      workerId,
      startISO,
      endISO,
      summary: `Reserva ${nombre}`,
      description: `Tel: ${telefono}`
    })
  });
  return r.json();
}
