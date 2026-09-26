export const money=(value:number|null|undefined)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value??0);
export const date=(value:string|null|undefined)=>value?new Date(value).toLocaleString("en-IN"):"—";
export const tone=(status:string)=>status==="ONLINE"||status==="APPROVED"||status==="COMPLETED"?"success":status==="SUSPENDED"||status==="REJECTED"||status==="CANCELLED"?"danger":status==="BUSY"?"info":status==="PENDING"?"warning":"neutral";
