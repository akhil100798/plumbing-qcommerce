/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { listSupportTickets, type SupportTicketSummary } from "@/services/supportService";
import { formatDate, supportTone } from "../supportHelpers";

export default function SupportEscalationsPage(){const[rows,setRows]=useState<SupportTicketSummary[]>([]);const[error,setError]=useState("");const load=useCallback(async()=>{try{const r=await listSupportTickets({status:"ESCALATED",size:50});setRows(r.content);}catch(x){setError(x instanceof Error?x.message:"Unable to load escalations");}},[]);useEffect(()=>{void load();},[load]);return <section className="panel"><div className="page-header"><div><h1 className="page-title">Escalations</h1><p className="page-subtitle">Tickets needing finance, operations, or leadership review.</p></div></div>{error?<div className="field-error">{error}</div>:null}<div className="table-shell"><table className="table"><thead><tr><th>Ticket</th><th>Requester</th><th>Reason</th><th>Related</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead><tbody>{rows.map(t=><tr key={t.ticketId}><td>{t.ticketNumber}<br/>{t.subject}</td><td>{t.requesterName}<br/>{t.requesterRole}</td><td>{t.escalationReason??"-"}</td><td>Product #{t.relatedProductOrderId??"-"}<br/>Service #{t.relatedServiceOrderId??"-"}</td><td><StatusBadge tone={supportTone(t.status)}>{t.status}</StatusBadge></td><td>{formatDate(t.updatedAt)}</td><td><Link className="button button-secondary" href={`/support/tickets/${t.ticketId}`}>Open</Link></td></tr>)}</tbody></table></div></section>}