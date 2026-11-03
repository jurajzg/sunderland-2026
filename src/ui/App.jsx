import React,{useEffect,useState} from 'react';
import {Menu, X, MapPin, Plane, TrainFront, BedDouble, Ticket, CalendarDays, Utensils, CloudSun, ShieldCheck, Lock, ExternalLink} from 'lucide-react';
import {trip,flights,trains,itinerary,pubs} from '../data';
const nav=[['Početna','home'],['Letovi','flights'],['Vlakovi','trains'],['Smještaj','stay'],['Utakmica','match'],['Plan putovanja','plan'],['Pubovi i restorani','pubs'],['Vrijeme','weather']];
const icons={home:ShieldCheck,flights:Plane,trains:TrainFront,stay:BedDouble,match:Ticket,plan:CalendarDays,pubs:Utensils,weather:CloudSun};
function Table({heads,rows}){return <div className="table-wrap"><table><thead><tr>{heads.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((x,j)=><td key={j}>{x}</td>)}</tr>)}</tbody></table></div>}
function App(){
 const [page,setPage]=useState('home'),[menu,setMenu]=useState(false);
 const title=nav.find(n=>n[1]===page)?.[0];
 return <div className="app">
  <header><button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Izbornik">{menu?<X/>:<Menu/>}</button><a className="brand" onClick={()=>setPage('home')}><span className="crest">S</span><span>SUNDERLAND <b>2026</b><small>PUTOVANJE JURAJ & BUCO</small></span></a><div className="header-date">05—06 / 11 / 2026</div></header>
  <div className="shell"><aside className={menu?'open':''}><div className="nav-label">PUTOVANJE</div>{nav.map(([label,id])=>{const I=icons[id];return <button key={id} className={page===id?'active':''} onClick={()=>{setPage(id);setMenu(false)}}><I size={18}/>{label}</button>})}<div className="side-note">TWO DAYS. ONE CITY. ONE CLUB.</div></aside>
  <main><div className="eyebrow">ENGLAND · NOVEMBER 2026 <span>●</span> {title}</div>
  {page==='home'&&<><section className="hero"><div className="hero-content"><div className="pill">MATCHDAY TRIP · 2026</div><h1>ONE CITY.<br/><em>ONE CLUB.</em></h1><p>Juraj & Buco u Sunderlandu. Dva dana, jedna utakmica i putovanje koje se pamti.</p><button className="primary" onClick={()=>setPage('plan')}>PREGLEDAJ PLAN PUTOVANJA <span>→</span></button></div><div className="hero-mark">SAFC</div></section><div className="count-grid"><div><small>DATUM</small><strong>05—06 NOV</strong></div><div><small>UTAKMICA</small><strong>SUNDERLAND vs DINAMO</strong></div><div><small>POČETAK</small><strong>20:00 <i>GMT</i></strong></div></div><section className="section"><div className="section-head"><div><div className="eyebrow">THE ESSENTIALS</div><h2>Putovanje na jednom mjestu.</h2></div></div><div className="cards"><Info title="Letovi" text="Četiri leta, dva putnika." icon={<Plane/>} click={()=>setPage('flights')}/><Info title="Vlakovi" text="Edinburgh – Newcastle – Sunderland." icon={<TrainFront/>} click={()=>setPage('trains')}/><Info title="Smještaj" text={trip.accommodation} icon={<BedDouble/>} click={()=>setPage('stay')}/></div></section></>}
  {page==='flights'&&<Section title="Letovi" sub="ČETIRI LETA · DVA PUTNIKA"><p className="notice warn">Važno: Dublin 5. 11. je presjedanje na odvojenim rezervacijama. Razmak je 2 h 10 min, bez predane prtljage. Odmah nakon slijetanja krenite prema sljedećem letu; kašnjenje prvog leta može ugroziti vezu.</p><Table heads={['Datum','Let','Od','Do','Polazak','Dolazak','Putnici']} rows={flights}/><p className="muted">Cilj dolaska u zračnu luku: 90 minuta prije polaska. Ukrcajne propusnice dodaju se nakon check-ina.</p><TicketAccess/></Section>}
  {page==='trains'&&<Section title="Vlakovi" sub="ČETVRTAK · 5. STUDENOGA"><Table heads={['Prijevoznik','Od','Do','Polazak','Dolazak','Napomena']} rows={trains.map(r=>[r[5],r[1],r[2],r[3],r[4],r[5].includes('LNER')?'Coach H · Juraj 66 · Buco 65':''])}/><p className="muted">Ulaznice: po dvije PDF datoteke za svaku osobu (Edinburgh Gateway–Newcastle i Newcastle–Sunderland).</p><TicketAccess/></Section>}
  {page==='stay'&&<Section title="Smještaj" sub="SUNDERLAND · CITY"><div className="feature"><div><div className="eyebrow">OUR BASE</div><h3>{trip.accommodation}</h3><p>{trip.address}</p><a className="text-link" href={trip.map} target="_blank" rel="noreferrer">OTVORI NA GOOGLE MAPS <ExternalLink size={14}/></a></div><BedDouble size={60}/></div><p className="muted">Plan: prvo odlazak u apartman, ostavljanje prtljage i kratki odmor, zatim polazak prema stadionu.</p></Section>}
  {page==='match'&&<Section title="Utakmica" sub="MATCHDAY · 05.11.2026"><div className="match-card"><div className="team">SUNDERLAND</div><div className="versus">VS</div><div className="team dinamo">DINAMO<br/>ZAGREB</div><div className="match-meta">STADIUM OF LIGHT · 20:00 · ČETVRTAK</div></div><TicketAccess/></Section>}
  {page==='plan'&&<Section title="Plan putovanja" sub="ČETVRTAK · 5. STUDENOGA"><div className="timeline">{itinerary.map((x,i)=><div className="event" key={i}><b>{x[0]}</b><div><strong>{x[1]}</strong><p>{x[2]}</p></div></div>)}</div><div className="notice">Petak, 6. 11.: povratak iz Newcastlea. Let FR21 polazi u 14:55, a FR2192 iz Dublina u 19:15.</div></Section>}
  {page==='pubs'&&<Section title="Pubovi i restorani" sub="FOOD · DRINK · MATCHDAY">{pubs.map(p=><div className="feature" key={p.name}><div><h3>{p.name}</h3><p>{p.desc}</p></div><Utensils size={34}/></div>)}</Section>}
  {page==='weather'&&<Section title="Vrijeme" sub="SUNDERLAND · 5–6.11.2026"><WeatherForecast/></Section>}
  <footer><span>SUNDERLAND 2026</span><span>JURAJ & BUCO · PRIVATE TRIP</span></footer></main></div></div>
}

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=54.9069&longitude=-1.3838&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Europe%2FLondon&start_date=2026-11-05&end_date=2026-11-06';
const weatherLabels = code => {
 if(code===0) return 'Vedro';
 if([1,2].includes(code)) return 'Pretežno vedro';
 if(code===3) return 'Oblačno';
 if([45,48].includes(code)) return 'Magla';
 if([51,53,55,56,57].includes(code)) return 'Rosulja';
 if([61,63,65,66,67,80,81,82].includes(code)) return 'Kiša';
 if([71,73,75,77,85,86].includes(code)) return 'Snijeg';
 if([95,96,99].includes(code)) return 'Grmljavinsko nevrijeme';
 return 'Promjenjivo';
};
function WeatherForecast(){
 const [forecast,setForecast]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(WEATHER_URL,{signal:controller.signal})
   .then(r=>{if(!r.ok) throw new Error('Weather API unavailable'); return r.json();})
   .then(data=>{
    const d=data.daily;
    if(!d || !Array.isArray(d.time) || d.time.length!==2) throw new Error('Forecast not available');
    setForecast(d.time.map((date,i)=>({date,code:d.weather_code?.[i],max:d.temperature_2m_max?.[i],min:d.temperature_2m_min?.[i],rain:d.precipitation_probability_max?.[i],wind:d.wind_speed_10m_max?.[i]})));
   })
   .catch(e=>{if(e.name!=='AbortError') setError(true);})
   .finally(()=>setLoading(false));
  return ()=>controller.abort();
 },[]);
 const dateLabel=date=>new Date(`${date}T12:00:00`).toLocaleDateString('hr-HR',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/London'});
 if(loading) return <div className="notice">Dohvaćamo aktualnu prognozu za Sunderland…</div>;
 if(error || !forecast || forecast.some(x=>![x.max,x.min].every(Number.isFinite))) return <div className="notice">Prognoza za 5. i 6. studenoga trenutačno nije dostupna. Podatke ćemo prikazati čim ih meteorološki servis objavi; ne prikazujemo izmišljene podatke.</div>;
 return <>
  <div className="notice">Prognoza se automatski dohvaća iz Open-Meteo servisa. Vrijeme u Sunderlandu (lokalno vrijeme, Europe/London).</div>
  <div className="cards weather-cards">{forecast.map(day=><article className="info-card weather-card" key={day.date}>
   <div><b>{dateLabel(day.date)}</b><small>{weatherLabels(day.code)}</small><strong className="weather-temp">{Math.round(day.max)}° / {Math.round(day.min)}°C</strong>
   <small>Vjerojatnost oborina: {Number.isFinite(day.rain)?`${day.rain}%`:'—'}</small><small>Maks. vjetar: {Number.isFinite(day.wind)?`${Math.round(day.wind)} km/h`:'—'}</small></div>
  </article>)}</div>
  <p className="muted">Prognoza je promjenjiva i može se ažurirati. Provjeri je ponovno neposredno prije polaska.</p>
 </>;
}

function Info({title,text,icon,click}){return <button className="info-card" onClick={click}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><i>↗</i></button>}
function Section({title,sub,children}){return <section className="section page-section"><div className="eyebrow">{sub}</div><h2>{title}</h2>{children}</section>}
function TicketAccess(){return <div className="ticket-box"><div className="ticket-lock"><Lock/></div><div><b>Privatne ulaznice</b><p>PDF ulaznice bit će dostupne nakon postavljanja sigurnog PIN sustava.</p></div><span className="status">ZAKLJUČANO</span></div>}
export default App;
