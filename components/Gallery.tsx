"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useLanguage} from "@/components/LanguageProvider";
type P={id:string;guest_name:string;caption:string|null;storage_path:string};
export default function Gallery(){
 const {lang}=useLanguage();
 const [photos,setPhotos]=useState<P[]>([]);
 useEffect(()=>{(async()=>{
  const {data}=await createClient().from("photos").select("id,guest_name,caption,storage_path").eq("approved",true).order("created_at",{ascending:false}).limit(12);
  setPhotos(data??[]);
 })()},[]);
 if(!photos.length)return <div className="card muted">—</div>;
 const storage=createClient().storage.from("wedding-photos");
 return <div className="gallery">{photos.map(p=>{
  const {data}=storage.getPublicUrl(p.storage_path);
  return <figure className="galleryItem" key={p.id} tabIndex={0}>
   <img src={data.publicUrl} alt={p.caption||p.guest_name}/>
   <figcaption className="galleryCaption"><strong>{lang==="fr"?"Partagée par":"Shared by"} {p.guest_name}</strong>{p.caption&&<span>{p.caption}</span>}</figcaption>
  </figure>;
 })}</div>
}
