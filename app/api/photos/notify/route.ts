import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {sendAdminNotification} from "@/lib/notifications";
/** Cette route ne divulgue aucune photo. L'identifiant de stockage aléatoire sert de preuve de soumission. */
export async function POST(request:Request){
 try{
  const {path}=await request.json();
  if(typeof path!=="string"||path.length>250||! /^[0-9a-f]{8}-[0-9a-f-]{27,}-[^/]+\.jpg$/i.test(path))return NextResponse.json({error:"invalid_request"},{status:400});
  const db=createAdminClient();
  const {data,error}=await db.from("photos").update({notification_sent_at:new Date().toISOString()})
    .eq("storage_path",path).eq("approved",false).is("notification_sent_at",null)
    .select("id").maybeSingle();
  if(error)throw error;
  if(data)await sendAdminNotification({subject:"Nouvelle photo à approuver",message:"Une personne vient d’ajouter une photo à la galerie. Vous pouvez la consulter et modifier son nom ou sa description dans l’administration."});
  return NextResponse.json({ok:true});
 }catch(e){console.error("photo notification error",e);return NextResponse.json({error:"server_error"},{status:500})}
}
