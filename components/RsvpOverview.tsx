"use client";
import { useMemo, useState } from "react";

type Guest = {id:string;first_name:string;last_name:string|null;attending:boolean|null;is_child:boolean;child_age:number|null;allergies_intolerances:string|null;food_aversions:string|null;menu_option_id:string|null;pre_wedding_dinner_attending:boolean|null;rehearsal_attending:boolean|null};
type Family = {id:string;name:string;code:string;rsvp_completed_at:string|null;hotel_stay:string|null;invited_pre_wedding_dinner:boolean;invited_rehearsal:boolean;song_suggestion:string|null;message_to_couple:string|null;shared_memory:string|null;guests:Guest[];family_emails:{email:string}[]};
type Option={id:string;label_fr:string};
export default function RsvpOverview({families,menuOptions}:{families:Family[];menuOptions:Option[]}){
 const [filter,setFilter]=useState("all");
 const [search,setSearch]=useState("");
 const options=new Map(menuOptions.map(o=>[o.id,o.label_fr]));
 const all=useMemo(()=>families.flatMap(f=>(f.guests||[]).map(g=>({f,g}))),[families]);
 const visible=all.filter(({f,g})=>{
   const q=(f.name+" "+g.first_name+" "+(g.last_name||"")+" "+f.code).toLowerCase();
   if(!q.includes(search.toLowerCase().trim()))return false;
   return filter==="all" ||
     (filter==="present"&&g.attending===true) ||
     (filter==="waiting"&&g.attending===null) ||
     (filter==="child"&&g.is_child) ||
     (filter==="allergy"&&Boolean(g.allergies_intolerances?.trim())) ||
     (filter==="menu"&&g.attending===true&&!g.menu_option_id);
 });
 const download=()=>{
  const headers=["Famille","Code","Invité","Enfant","Âge au mariage","Présence","Menu","Allergies","Aversions","Souper veille","Répétition","Hébergement","RSVP reçu","Courriels","Chanson","Petit mot","Souvenir"];
  const answer=(x:boolean|null)=>x===true?"Oui":x===false?"Non":"En attente";
  const rows=visible.map(({f,g})=>[f.name,f.code,g.first_name+" "+(g.last_name||""),g.is_child?"Oui":"Non",g.is_child?(g.child_age??""):"",answer(g.attending),g.menu_option_id?options.get(g.menu_option_id)||"—":"",g.allergies_intolerances||"",g.food_aversions||"",f.invited_pre_wedding_dinner?answer(g.pre_wedding_dinner_attending):"Non invité",f.invited_rehearsal?answer(g.rehearsal_attending):"Non invité",f.hotel_stay||"",f.rsvp_completed_at||"",f.family_emails?.map(e=>e.email).join("; ")||"",f.song_suggestion||"",f.message_to_couple||"",f.shared_memory||""]);
  const escape=(v:unknown)=>'"'+String(v??"").replace(/"/g,'""').replace(/^[=+@\-]/,"'$&")+'"';
  const csv="\uFEFF"+[headers,...rows].map(row=>row.map(escape).join(";")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="mariage-2027-reponses.csv";a.click();URL.revokeObjectURL(url);
 };
 return <section className="card" style={{margin:"24px 0"}}>
   <div className="familyHead"><div><div className="eyebrow">Vue d’ensemble</div><h2 className="serif" style={{fontSize:32}}>Tableau des réponses</h2></div><button type="button" className="btn" onClick={download}>Exporter CSV / Excel</button></div>
   <p className="muted">Une ligne par invité. Les réponses restent visibles seulement dans l’administration.</p>
   <div className="inlineForm" style={{marginBottom:18}}>
    <div className="field"><label htmlFor="overview-search">Rechercher une famille ou un invité</label><input id="overview-search" className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom ou code" /></div>
    <div className="field"><label htmlFor="overview-filter">Filtrer</label><select id="overview-filter" className="input" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tous</option><option value="present">Présents</option><option value="waiting">En attente</option><option value="child">Enfants</option><option value="allergy">Allergies</option><option value="menu">Menu non choisi</option></select></div>
   </div>
   <p className="muted">{visible.length} invité(s) affiché(s) · {all.filter(x=>x.g.attending===true).length} présents · {all.filter(x=>x.g.is_child&&x.g.attending===true).length} enfants présents</p>
   <div className="tableWrap"><table className="table"><thead><tr><th>Famille / invité</th><th>RSVP</th><th>Âge enfant</th><th>Repas</th><th>Allergies / aversions</th><th>Activités</th></tr></thead><tbody>
    {visible.map(({f,g})=><tr key={g.id}><td><strong>{g.first_name} {g.last_name||""}</strong><div className="muted">{f.name}</div></td><td>{g.attending===true?"Présent":g.attending===false?"Absent":"En attente"}</td><td>{g.is_child?(g.child_age===null?"À préciser":`${g.child_age} ans`):"—"}</td><td>{g.menu_option_id?options.get(g.menu_option_id)||"—":g.attending?"Non choisi":"—"}</td><td>{g.allergies_intolerances||"—"}{g.food_aversions&&<div className="muted">Aversions : {g.food_aversions}</div>}</td><td>{f.invited_pre_wedding_dinner&&<div>Veille : {g.pre_wedding_dinner_attending===true?"Oui":g.pre_wedding_dinner_attending===false?"Non":"?"}</div>}{f.invited_rehearsal&&<div>Répétition : {g.rehearsal_attending===true?"Oui":g.rehearsal_attending===false?"Non":"?"}</div>}</td></tr>)}
   </tbody></table></div>
   <div className="hr"/><h3 className="serif" style={{fontSize:27}}>Chansons, mots et souvenirs</h3>
   {families.filter(f=>f.song_suggestion||f.message_to_couple||f.shared_memory).length===0?<p className="muted">Aucune réponse reçue pour le moment.</p>:
   families.filter(f=>f.song_suggestion||f.message_to_couple||f.shared_memory).map(f=><details key={f.id} style={{padding:"10px 0",borderBottom:"1px solid var(--line)"}}><summary style={{cursor:"pointer"}}>{f.name}</summary>{f.song_suggestion&&<p><strong>Chanson :</strong> {f.song_suggestion}</p>}{f.message_to_couple&&<p><strong>Petit mot :</strong> {f.message_to_couple}</p>}{f.shared_memory&&<p><strong>Souvenir :</strong> {f.shared_memory}</p>}</details>)}
 </section>
}
