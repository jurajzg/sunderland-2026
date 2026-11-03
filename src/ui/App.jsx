import React, { useEffect, useState } from 'react';
import {
  Menu, X, Plane, TrainFront, BedDouble, Ticket, CalendarDays,
  Utensils, CloudSun, ShieldCheck, Lock, ExternalLink, CloudRain,
  Cloud, Sun, Wind, Droplets, MapPin
} from 'lucide-react';
import { trip, flights, trains, itinerary, pubs } from '../data';

const nav = [
  ['Početna', 'home'], ['Letovi', 'flights'], ['Vlakovi', 'trains'],
  ['Smještaj', 'stay'], ['Utakmica', 'match'], ['Plan putovanja', 'plan'],
  ['Pubovi i restorani', 'pubs'], ['Vrijeme', 'weather']
];
const icons = {
  home: ShieldCheck, flights: Plane, trains: TrainFront, stay: BedDouble,
  match: Ticket, plan: CalendarDays, pubs: Utensils, weather: CloudSun
};

const MATCH_DATE = new Date('2026-11-05T20:00:00+00:00');
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=54.9069&longitude=-1.3838&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Europe%2FLondon&start_date=2026-11-05&end_date=2026-11-06';

function useCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const diff = Math.max(0, MATCH_DATE.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    finished: diff === 0
  };
}

function weatherDescription(code) {
  if (code === 0) return 'Vedro';
  if ([1, 2].includes(code)) return 'Djelomice oblačno';
  if (code === 3) return 'Oblačno';
  if ([45, 48].includes(code)) return 'Magla';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Rosulja';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Kiša';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snijeg';
  if ([95, 96, 99].includes(code)) return 'Grmljavina';
  return 'Promjenjivo';
}
function WeatherIcon({ code }) {
  if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return <CloudRain />;
  if (code === 0) return <Sun />;
  if ([1, 2, 3, 45, 48].includes(code)) return <Cloud />;
  return <CloudSun />;
}
function shortDate(index) {
  return index === 0 ? 'ČETVRTAK, 5.11. · DAN UTAKMICE' : 'PETAK, 6.11. · POVRATAK';
}
function WeatherSummary() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(WEATHER_URL)
      .then(r => { if (!r.ok) throw new Error('Weather unavailable'); return r.json(); })
      .then(data => { if (active && data?.daily?.time?.length >= 2) setWeather(data.daily); else if (active) setError(true); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  return (
    <section className="home-weather">
      <div className="home-weather-head">
        <h2><CloudSun size={20}/> PROGNOZA ZA SUNDERLAND</h2>
        <a href="#" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('sunderland-weather-page')); }}>Više →</a>
      </div>
      {!weather ? (
        <div className="weather-message">
          {error ? 'Trenutačno nije moguće dohvatiti prognozu. Pokušajte ponovno kasnije.' : 'Dohvaćamo aktualnu prognozu za Sunderland…'}
        </div>
      ) : (
        <div className="weather-days">
          {[0, 1].map(i => (
            <div className="weather-day" key={weather.time[i]}>
              <div className="weather-symbol"><WeatherIcon code={weather.weather_code[i]} /></div>
              <div className="weather-detail">
                <small>{shortDate(i)}</small>
                <strong>{Math.round(weather.temperature_2m_max[i])}° / {Math.round(weather.temperature_2m_min[i])}°</strong>
                <span>{weatherDescription(weather.weather_code[i])} <i>·</i> <Droplets size={13}/> Kiša {weather.precipitation_probability_max?.[i] ?? '—'}% <i>·</i> <Wind size={13}/> {Math.round(weather.wind_speed_10m_max[i])} km/h</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Table({ heads, rows }) {
  return <div className="table-wrap"><table><thead><tr>{heads.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>;
}
function App() {
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState(false);
  const countdown = useCountdown();
  const title = nav.find(n => n[1] === page)?.[0];

  useEffect(() => {
    const goWeather = () => setPage('weather');
    window.addEventListener('sunderland-weather-page', goWeather);
    return () => window.removeEventListener('sunderland-weather-page', goWeather);
  }, []);

  return <div className="app">
    <header>
      <button className="mobile-menu" onClick={() => setMenu(!menu)} aria-label="Izbornik">{menu ? <X/> : <Menu/>}</button>
      <a className="brand" onClick={() => setPage('home')}><span className="crest">S</span><span>SUNDERLAND <b>2026</b><small>PUTOVANJE JURAJ & BUCO</small></span></a>
      <div className="header-date">05—06 / 11 / 2026</div>
    </header>
    <div className="shell">
      <aside className={menu ? 'open' : ''}>
        <div className="nav-label">PUTOVANJE</div>
        {nav.map(([label, id]) => { const I = icons[id]; return <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setMenu(false); }}><I size={18}/>{label}</button>; })}
        <div className="side-note">TWO DAYS. ONE CITY. ONE CLUB.</div>
      </aside>
      <main>
        <div className="eyebrow">ENGLAND · NOVEMBER 2026 <span>●</span> {title}</div>
        {page === 'home' && <>
          <section className="hero-match">
            <div className="hero-match-content">
              <div className="pill">ZAGREB → SUNDERLAND · 5. STUDENOGA 2026.</div>
              <h1>SUNDERLAND <em>VS</em><br className="hero-break"/> DINAMO ZAGREB</h1>
              <p><MapPin size={14}/> Stadium of Light, Sunderland · 5. studenoga 2026. · 20:00 (UK vrijeme)</p>
              <div className="countdown" aria-label="Odbrojavanje do utakmice">
                {countdown.finished ? <div className="countdown-finished">UTAKMICA JE POČELA</div> : <>
                  <div><strong>{String(countdown.days).padStart(2, '0')}</strong><small>DANA</small></div>
                  <div><strong>{String(countdown.hours).padStart(2, '0')}</strong><small>SATI</small></div>
                  <div><strong>{String(countdown.minutes).padStart(2, '0')}</strong><small>MIN</small></div>
                  <div><strong>{String(countdown.seconds).padStart(2, '0')}</strong><small>SEK</small></div>
                </>}
              </div>
            </div>
          </section>
          <div className="home-shortcuts">
            <Info title="Letovi" text="4 leta" icon={<Plane/>} click={() => setPage('flights')}/>
            <Info title="Vlakovi" text="3 dionice" icon={<TrainFront/>} click={() => setPage('trains')}/>
            <Info title="Smještaj" text={trip.accommodation} icon={<BedDouble/>} click={() => setPage('stay')}/>
            <Info title="Utakmica" text="20:00 · 5.11." icon={<Ticket/>} click={() => setPage('match')}/>
          </div>
          <WeatherSummary/>
          <section className="section home-more">
            <div className="section-head"><div><div className="eyebrow">THE ESSENTIALS</div><h2>Putovanje na jednom mjestu.</h2></div></div>
            <p className="muted">Sve važne informacije za putovanje Jurja i Buce u Sunderland – letovi, vlakovi, smještaj i utakmica.</p>
          </section>
        </>}
        {page === 'flights' && <Section title="Letovi" sub="ČETIRI LETA · DVA PUTNIKA"><p className="notice warn">Važno: Dublin 5. 11. je presjedanje na odvojenim rezervacijama. Razmak je 2 h 10 min, bez predane prtljage. Odmah nakon slijetanja krenite prema sljedećem letu; kašnjenje prvog leta može ugroziti vezu.</p><Table heads={['Datum','Let','Od','Do','Polazak','Dolazak','Putnici']} rows={flights}/><p className="muted">Cilj dolaska u zračnu luku: 90 minuta prije polaska. Ukrcajne propusnice dodaju se nakon check-ina.</p><TicketAccess category="flight"/></Section>
        {page === 'trains' && <Section title="Vlakovi" sub="ČETVRTAK · 5. STUDENOGA"><Table heads={['Prijevoznik','Od','Do','Polazak','Dolazak','Napomena']} rows={trains.map(r => [r[5],r[1],r[2],r[3],r[4],r[5].includes('LNER') ? 'Coach H · Juraj 66 · Buco 65' : ''])}/><p className="muted">Ulaznice: po dvije PDF datoteke za svaku osobu (Edinburgh Gateway–Newcastle i Newcastle–Sunderland).</p><TicketAccess category="train"/></Section>}
        {page === 'stay' && <Section title="Smještaj" sub="SUNDERLAND · CITY"><div className="feature"><div><div className="eyebrow">OUR BASE</div><h3>{trip.accommodation}</h3><p>{trip.address}</p><a className="text-link" href={trip.map} target="_blank" rel="noreferrer">OTVORI NA GOOGLE MAPS <ExternalLink size={14}/></a></div><BedDouble size={60}/></div><p className="muted">Plan: prvo odlazak u apartman, ostavljanje prtljage i kratki odmor, zatim polazak prema stadionu.</p></Section>}
        {page === 'match' && <Section title="Utakmica" sub="MATCHDAY · 05.11.2026"><div className="match-card"><div className="team">SUNDERLAND</div><div className="versus">VS</div><div className="team dinamo">DINAMO<br/>ZAGREB</div><div className="match-meta">STADIUM OF LIGHT · 20:00 · ČETVRTAK</div></div><TicketAccess category="match"/></Section>}
        {page === 'plan' && <Section title="Plan putovanja" sub="ČETVRTAK · 5. STUDENOGA"><div className="timeline">{itinerary.map((x,i) => <div className="event" key={i}><b>{x[0]}</b><div><strong>{x[1]}</strong><p>{x[2]}</p></div></div>)}</div><div className="notice">Petak, 6. 11.: povratak iz Newcastlea. Let FR21 polazi u 14:55, a FR2192 iz Dublina u 19:15.</div></Section>}
        {page === 'pubs' && <Section title="Pubovi i restorani" sub="FOOD · DRINK · MATCHDAY">{pubs.map(p => <div className="feature" key={p.name}><div><h3>{p.name}</h3><p>{p.desc}</p></div><Utensils size={34}/></div>)}</Section>}
        {page === 'weather' && <Section title="Vrijeme" sub="SUNDERLAND · 5–6.11.2026"><WeatherSummary/></Section>}
        <footer><span>SUNDERLAND 2026</span><span>JURAJ & BUCO · PRIVATE TRIP</span></footer>
      </main>
    </div>
  </div>;
}
function Info({ title, text, icon, click }) {
  return <button className="info-card" onClick={click}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><i>↗</i></button>;
}
function Section({ title, sub, children }) {
  return <section className="section page-section"><div className="eyebrow">{sub}</div><h2>{title}</h2>{children}</section>;
}
const API_BASE = '';
function TicketAccess({ category }) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('Juraj');
  const [opening, setOpening] = useState(null);

  async function refresh() {
    const response = await fetch(`${API_BASE}/api/tickets`, { credentials: 'include' });
    if (!response.ok) throw new Error(response.status === 401 ? 'Sesija je istekla. Ponovno unesite PIN.' : 'Nije moguće dohvatiti ulaznice.');
    const data = await response.json();
    setTickets(data.tickets.filter(t => t.category === category));
  }
  async function unlock(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/unlock`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'PIN nije prihvaćen.');
      setUnlocked(true); setPin(''); await refresh();
    } catch (e) { setError(e.message || 'Greška povezivanja.'); }
    finally { setBusy(false); }
  }
  async function lock() {
    try { await fetch(`${API_BASE}/api/lock`, { method: 'POST', credentials: 'include' }); } catch {}
    setUnlocked(false); setTickets([]); setOpening(null);
  }
  async function openTicket(ticket) {
    setOpening(ticket.id); setError('');
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticket.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error(response.status === 401 ? 'Sesija je istekla. Ponovno unesite PIN.' : 'PDF nije moguće otvoriti.');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (e) { setError(e.message); if (String(e.message).includes('istekla')) { setUnlocked(false); setTickets([]); } }
    finally { setOpening(null); }
  }
  const visible = tickets.filter(t => t.person === selectedPerson);
  const categoryLabel = category === 'train' ? 'VLAKOVI' : category === 'flight' ? 'LETOVI' : 'UTAKMICA';
  return <div className="ticket-panel">
    {!unlocked ? <form className="ticket-unlock" onSubmit={unlock}>
      <div className="ticket-lock"><Lock/></div><div className="ticket-unlock-copy"><b>Privatne ulaznice · {categoryLabel}</b><p>Unesite zajednički PIN za pristup PDF ulaznicama.</p></div>
      <div className="ticket-pin-row"><input aria-label="PIN za ulaznice" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} placeholder="Unesite PIN" maxLength={64}/><button type="submit" disabled={busy || !pin}>{busy ? 'PROVJERA…' : 'OTKLJUČAJ'}</button></div>
      {error && <p className="ticket-error" role="alert">{error}</p>}
    </form> : <div className="ticket-private">
      <div className="ticket-private-head"><div><b>Ulaznice su otključane</b><p>Pristup se automatski zaključava nakon 15 minuta neaktivnosti.</p></div><button className="ticket-lock-button" onClick={lock}><Lock size={14}/> ZAKLJUČAJ</button></div>
      <div className="ticket-person-tabs"><button className={selectedPerson === 'Juraj' ? 'active' : ''} onClick={() => setSelectedPerson('Juraj')}>JURAJ</button><button className={selectedPerson === 'Buco' ? 'active' : ''} onClick={() => setSelectedPerson('Buco')}>BUCO</button></div>
      {visible.length ? <div className="ticket-list">{visible.map(ticket => <div className="ticket-row" key={ticket.id}><div className="ticket-file-icon"><Ticket size={18}/></div><div className="ticket-file-name"><b>{ticket.filename}</b><small>{ticket.person} · {categoryLabel}</small></div><button onClick={() => openTicket(ticket)} disabled={opening === ticket.id}>{opening === ticket.id ? 'OTVARANJE…' : 'OTVORI PDF ↗'}</button></div>)}</div> : <p className="ticket-empty">Još nema učitanih ulaznica za {selectedPerson}.</p>}
      {error && <p className="ticket-error" role="alert">{error}</p>}
    </div>}
  </div>;
}
export default App;
