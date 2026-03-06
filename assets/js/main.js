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

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('infoUserBtn');
  const dropdown = document.getElementById('infoUserDropdown');
  let isOpen = false;

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    if (isOpen) {
      dropdown.classList.add('opacity-0', 'invisible');
      dropdown.classList.remove('opacity-100', 'visible');
    } else {
      dropdown.classList.remove('opacity-0', 'invisible');
      dropdown.classList.add('opacity-100', 'visible');
    }
    isOpen = !isOpen;
  });

  // Close on click outside
  document.addEventListener('click', function(e) {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('opacity-0', 'invisible');
      dropdown.classList.remove('opacity-100', 'visible');
      isOpen = false;
    }
  });
});
