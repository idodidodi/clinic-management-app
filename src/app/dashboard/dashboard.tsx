"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient, createMeeting, createPayment, deleteClient, deleteMeeting, deletePayment, updateClient, updateClinicTariff, updateMeeting, updatePayment, updateUserSettings } from "./actions";

type Client = {
  id: string;
  fullName: string;
  externalRef: string;
  invoiceName?: string | null;
  clientType: string;
  preferredContact?: string | null;
  comments?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  email: string | null;
  phoneNumber?: string | null;
  familyAccountId: string;
  familyAccount?: { accountName: string; invoiceName?: string; invoiceDescription?: string | null; comments?: string | null };
  parentA?: { id: string; fullName: string; parentRole?: string | null } | null;
  parentB?: { id: string; fullName: string; parentRole?: string | null } | null;
  parentRole?: string | null;
  relationsFrom?: { relationType: string; relatedClient: RelatedClient }[];
  relationsTo?: { relationType: string; client: RelatedClient }[];
  tariffs?: { meetingType: string; tariff: string }[];
};
type RelatedClient = { id: string; fullName: string; clientType: string; parentRole?: string | null };
type Meeting = {
  id: string; startsAt: Date | string; type: string; workflowStatus: string; tariff: string;
  subjectClient: Client; invoices: { id: string; amount: string; status: string }[];
  participants?: Client[];
};
type Payment = {
  id: string; amount: string; paidAt: string; meeting: { id: string; startsAt: string; subjectClient: Client };
  payer: { fullName: string } | null; payerNameSnapshot: string | null;
};

const dateLabel = (value: Date | string, format: string) => {
  const date = new Date(value);
  const parts = [String(date.getDate()).padStart(2, "0"), String(date.getMonth() + 1).padStart(2, "0"), date.getFullYear()];
  return format === "MM_DD_YYYY" ? `${parts[1]}/${parts[0]}/${parts[2]}` : format === "YYYY_MM_DD" ? `${parts[2]}-${parts[1]}-${parts[0]}` : `${parts[0]}/${parts[1]}/${parts[2]}`;
};
const money = (value: string) => `$${Number(value).toFixed(2)}`;
const statusLabel = (value?: string) => (value || "registered").replaceAll("_", " ").toLowerCase();
const relatedMembers = (client: Client) => {
  const members = new Map<string, RelatedClient & { relationType: string }>();
  for (const relation of client.relationsFrom || []) {
    members.set(relation.relatedClient.id, { ...relation.relatedClient, relationType: relation.relationType });
  }
  for (const relation of client.relationsTo || []) {
    if (!members.has(relation.client.id)) {
      members.set(relation.client.id, { ...relation.client, relationType: relation.relationType });
    }
  }
  return [...members.values()];
};

export default function Dashboard({
  clinicName, clients, families, meetings, payments, invoices, payers, defaultTariff, dateFormat,
}: {
  clinicName: string; clients: Client[]; families: { id: string; accountName: string }[];
  meetings: Meeting[]; payments: Payment[]; invoices: { id: string; amount: string; meetingId: string }[];
  payers: { id: string; fullName: string }[];
  defaultTariff: string;
  dateFormat: string;
}) {
  const [tab, setTab] = useState("overview");
  const [clientSettingsId, setClientSettingsId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const due = useMemo(() => meetings.map((meeting) => {
    const paid = payments.filter((payment) => payment.meeting.id === meeting.id)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { meeting, due: Math.max(0, Number(meeting.tariff) - paid) };
  }).filter((row) => row.due > 0), [meetings, payments]);
  const filteredClients = clients.filter((client) => {
    const matchesName = client.fullName.toLowerCase().includes(clientFilter.toLowerCase());
    const matchesType = clientTypeFilter === "ALL"
      || (clientTypeFilter === "PARENT" && client.clientType === "PARENT")
      || (clientTypeFilter === "CHILD" && client.clientType === "CHILD")
      || (clientTypeFilter === "OTHER" && (client.clientType === "OTHER" || client.parentRole === "OTHER"));
    return matchesName && matchesType;
  });
  const filteredPayments = payments.filter((payment) => payment.meeting.subjectClient.fullName.toLowerCase().includes(paymentFilter.toLowerCase()));
  const filteredDue = due.filter((row) => row.meeting.subjectClient.fullName.toLowerCase().includes(dueFilter.toLowerCase()));
  const openClientSettings = (clientId: string) => {
    setClientSettingsId(clientId);
    setTab("clients");
  };

  useEffect(() => {
    if (tab !== "clients" || !clientSettingsId) return;
    document.getElementById(`client-${clientSettingsId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tab, clientSettingsId]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div><p className="kicker">Manager workspace</p><h1>{clinicName}</h1></div>
        <div className="dashboard-header-actions"><Link href="/" className="dashboard-home">Home</Link><ClinicSettingsMenu defaultTariff={defaultTariff} /></div>
      </header>
      <nav className="dashboard-nav" aria-label="Dashboard sections">
        {["overview", "clients", "meetings", "payments", "due"].map((item) => (
          <button key={item} className={tab === item ? "nav-active" : ""} onClick={() => setTab(item)}>
            {item === "due" ? "Due payments" : item}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="dashboard-grid">
          <article className="dashboard-card dashboard-card-wide"><p className="kicker">Outstanding</p><strong>{money(due.reduce((sum, row) => sum + row.due, 0).toString())}</strong><span>{due.length} meetings need attention</span></article>
          <article className="dashboard-card"><p className="kicker">Families</p><strong>{families.length}</strong><span>Family accounts with connected clients</span></article>
          <article className="dashboard-card"><p className="kicker">Payments</p><strong>{payments.length}</strong><span>Recorded locally</span></article>
          <section className="dashboard-card"><p className="kicker">User settings</p><h2>Date format</h2><DateFormatForm dateFormat={dateFormat} /></section>
          <section className="dashboard-card dashboard-card-wide"><div className="section-heading"><h2>Recent meetings</h2><button onClick={() => setTab("meetings")}>View all</button></div><MeetingTable meetings={meetings.slice(0, 8)} onDelete={deleteMeeting} dateFormat={dateFormat} /></section>
        </section>
      )}

      {tab === "clients" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Directory</p><div className="heading-with-action"><h2>Clients</h2><details className="add-menu"><summary aria-label="Add client or family">+</summary><div className="add-panel"><h3>Create parent client</h3><ClientForm /><h3>Add family member</h3><FamilyMemberForm clients={clients} /></div></details></div><p className="table-help">Start with a parent client, then add children, a second parent, or another family member.</p></div><div className="filter-row"><input placeholder="Filter by name" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} /><select aria-label="Filter by client type" value={clientTypeFilter} onChange={(e) => setClientTypeFilter(e.target.value)}><option value="ALL">All types</option><option value="CHILD">Child</option><option value="PARENT">Parents</option><option value="OTHER">Other</option></select></div></div><table><thead><tr><th>Client</th><th>Type</th><th>Family members</th><th>Contact</th><th /></tr></thead><tbody>{filteredClients.map((client) => <tr id={`client-${client.id}`} key={client.id}><td><strong>{client.fullName}</strong><small className="muted-cell">{client.email || "No email"}</small></td><td><span className="type-pill">{client.clientType === "PARENT" ? client.parentRole === "DAD" ? "Dad" : client.parentRole === "OTHER" ? "Other" : "Mom" : client.clientType === "OTHER" ? "Other" : statusLabel(client.clientType)}</span></td><td><span className="parent-list">{relatedMembers(client).map((member) => <span key={`${client.id}-${member.id}`}><span className="muted-cell">{member.relationType.toLowerCase()}:</span> <a className="client-link" href={`#client-${member.id}`}>{member.fullName}</a><br /></span>)}</span></td><td>{client.phoneNumber || client.email || "—"}</td><td className="row-actions"><button className="secondary-button" type="button" onClick={() => openClientSettings(client.id)}>View</button></td></tr>)}</tbody></table>{clients.map((client) => <ClientViewModal key={`modal-${client.id}`} client={client} open={clientSettingsId === client.id} onClose={() => setClientSettingsId(null)} />)}</section>}
      {tab === "meetings" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Calendar</p><h2>Meetings</h2></div></div><MeetingForm clients={clients} /><MeetingTable meetings={meetings} onDelete={deleteMeeting} dateFormat={dateFormat} onClientClick={openClientSettings} /></section>}
      {tab === "payments" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Cash flow</p><h2>Payments</h2></div><input placeholder="Filter by client" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} /></div><PaymentForm meetings={meetings} payers={payers} invoices={invoices} dateFormat={dateFormat} /><table><thead><tr><th>Date</th><th>Client</th><th>Payer</th><th>Amount</th><th /></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.id}><td>{dateLabel(payment.paidAt, dateFormat)}</td><td>{payment.meeting.subjectClient.fullName}</td><td>{payment.payer?.fullName || payment.payerNameSnapshot || "Unidentified"}</td><td>{money(payment.amount)}</td><td className="row-actions"><details><summary>Edit</summary><form action={updatePayment} className="edit-form"><input type="hidden" name="id" value={payment.id} /><input name="amount" defaultValue={payment.amount} type="number" min="0" step="0.01" required /><input name="paidAt" defaultValue={payment.paidAt.slice(0, 10)} type="date" required /><input name="payerName" defaultValue={payment.payerNameSnapshot || payment.payer?.fullName || ""} /><button className="primary-button">Save</button></form></details><form action={deletePayment}><input type="hidden" name="id" value={payment.id} /><button className="danger">Delete</button></form></td></tr>)}</tbody></table></section>}
      {tab === "due" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Collections</p><h2>Due payments</h2></div><input placeholder="Filter by client" value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} /></div><table><thead><tr><th>Date</th><th>Client</th><th>Status</th><th>Due</th></tr></thead><tbody>{filteredDue.map((row) => <tr key={row.meeting.id}><td>{dateLabel(row.meeting.startsAt, dateFormat)}</td><td>{row.meeting.subjectClient.fullName}</td><td>{statusLabel(row.meeting.workflowStatus)}</td><td>{money(row.due.toString())}</td></tr>)}</tbody></table></section>}
    </main>
  );
}

function ClientForm() {
  return <form className="inline-form client-add-form" action={createClient}><input name="fullName" required placeholder="Parent full name" /><input name="invoiceName" placeholder="Invoice name" /><input type="hidden" name="clientType" value="PARENT" /><select name="parentRole" defaultValue="MOM"><option value="MOM">Mom</option><option value="DAD">Dad</option><option value="OTHER">Other</option></select><input name="email" type="email" placeholder="Email" /><TariffInputs /><button className="primary-button">Create parent</button></form>;
}

function FamilyMemberForm({ clients }: { clients: Client[] }) {
  const parents = clients.filter((client) => client.clientType === "PARENT");
  return <form className="inline-form client-add-form" action={createClient}><input name="fullName" required placeholder="Family member full name" /><input name="invoiceName" placeholder="Invoice name" /><select name="parentClientId" required><option value="">Connect to parent client</option>{parents.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select><select name="clientType" defaultValue="CHILD"><option value="CHILD">Child</option><option value="PARENT">Parent</option><option value="OTHER">Other family member</option></select><select name="parentRole" defaultValue="OTHER"><option value="OTHER">Other</option><option value="MOM">Mom</option><option value="DAD">Dad</option></select><TariffInputs /><button className="primary-button">Add member</button></form>;
}

function ClientViewModal({ client, open, onClose }: { client: Client; open: boolean; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose, open]);

  const fields: [string, string][] = [
    ["External reference", client.externalRef],
    ["Full name", client.fullName],
    ["Invoice name", client.invoiceName || "—"],
    ["Client type", client.clientType],
    ["Parent role", client.parentRole || "—"],
    ["Phone number", client.phoneNumber || "—"],
    ["Email", client.email || "—"],
    ["Preferred contact", client.preferredContact || "—"],
    ["Comments", client.comments || "—"],
    ["Family account", client.familyAccount?.accountName || "—"],
    ["Family invoice name", client.familyAccount?.invoiceName || "—"],
    ["Invoice description", client.familyAccount?.invoiceDescription || "—"],
    ["Family comments", client.familyAccount?.comments || "—"],
    ["Created", client.createdAt ? new Date(client.createdAt).toLocaleString() : "—"],
    ["Updated", client.updatedAt ? new Date(client.updatedAt).toLocaleString() : "—"],
  ];
  return <div className={`client-modal-backdrop${open ? " client-modal-open" : ""}`} aria-hidden={!open}><div className="client-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label={`${client.fullName} details`}>
    {!editing ? <><div className="client-modal-header"><div><p className="kicker">Client details</p><h2>{client.fullName}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button></div><div className="client-fields">{fields.map(([label, value]) => <div className="client-field" key={label}><div><span>{label}</span><strong>{value}</strong></div><CopyButton value={value} /></div>)}</div><div className="client-modal-actions"><button type="button" className="primary-button" onClick={() => setEditing(true)}>Edit</button><button type="button" className="danger" onClick={() => setConfirmDelete(true)}>Delete</button></div>{confirmDelete && <div className="delete-confirmation"><p>Delete this client? This cannot be undone.</p><form action={deleteClient}><input type="hidden" name="id" value={client.id} /><button className="danger">Confirm delete</button><button type="button" className="secondary-button" onClick={() => setConfirmDelete(false)}>Cancel</button></form></div>}</> : <><div className="client-modal-header"><div><p className="kicker">Edit client</p><h2>{client.fullName}</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button></div><form action={updateClient} className="edit-form-modal"><input type="hidden" name="id" value={client.id} /><label>Full name<input name="fullName" defaultValue={client.fullName} required /></label>{(client.clientType === "CHILD" || client.clientType === "PARENT") && <label>Phone number<input name="phoneNumber" defaultValue={client.phoneNumber || ""} type="tel" placeholder="Phone number" /></label>}<label>Email<input name="email" defaultValue={client.email || ""} type="email" placeholder="Email address" /></label><label>Invoice name<input name="invoiceName" defaultValue={client.invoiceName || ""} /></label><label>Preferred contact<select name="preferredContact" defaultValue={client.preferredContact || ""}><option value="">Not specified</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option></select></label><label>Comments<textarea name="comments" defaultValue={client.comments || ""} /></label><TariffInputs client={client} /><div className="edit-form-actions"><button className="primary-button">Save</button><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancel</button></div></form></>}
  </div></div>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="copy-button" onClick={() => { void navigator.clipboard.writeText(value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }); }}>{copied ? "Copied" : "Copy"}</button>;
}

function TariffInputs({ client }: { client?: Client }) {
  const types = !client ? ["CHILD", "PARENT_A", "PARENT_B", "BOTH_PARENTS"] : client.clientType === "PARENT" ? ["CHILD", "PARENT_A"] : ["CHILD"];
  return <div className="tariff-inputs">{types.map((type) => <label key={type}>{type === "PARENT_A" ? "Parent tariff" : "Child tariff"}<input name={`tariff-${type}`} type="number" min="0" step="0.01" defaultValue={client?.tariffs?.find((tariff) => tariff.meetingType === type)?.tariff} placeholder="Clinic default" /></label>)}</div>;
}

function MeetingForm({ clients }: { clients: Client[] }) {
  const [type, setType] = useState("CHILD");
  const eligible = clients.filter((client) => type === "CHILD" ? client.clientType === "CHILD" : type === "PARENT_A" ? client.parentRole === "MOM" : type === "PARENT_B" ? client.parentRole === "DAD" : client.clientType === "PARENT");
  return <form className="inline-form" action={createMeeting}><select name="type" value={type} onChange={(event) => setType(event.target.value)} required><option value="">Meeting type</option><option value="CHILD">Child meeting</option><option value="PARENT_A">Mom meeting</option><option value="PARENT_B">Dad meeting</option><option value="BOTH_PARENTS">Mom + Dad meeting</option></select><select name="clientId" required><option value="">Client</option>{eligible.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select><input name="startsAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /><button className="primary-button">Add meeting</button></form>;
}

function ClinicSettingsMenu({ defaultTariff }: { defaultTariff: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultTariff);
  const [savedValue, setSavedValue] = useState(defaultTariff);
  const menuRef = useRef<HTMLDivElement>(null);
  const dirty = value !== savedValue;

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dirty, open, savedValue]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await updateClinicTariff(formData);
    setSavedValue(value);
    setOpen(false);
  };

  const cancel = () => {
    setValue(savedValue);
    setOpen(false);
  };

  return <div className="settings-menu" ref={menuRef}>
    <button type="button" className="settings-trigger" aria-label="Clinic settings" onClick={() => setOpen((current) => !current)}>⚙</button>
    {open && <div className="settings-panel"><p className="kicker">Clinic settings</p><h2>Default tariff</h2><form className="inline-form" onSubmit={save}><label>Default tariff<input className="settings-tariff-input" name="defaultTariff" type="number" min="0" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} required /><span className={`unsaved-indicator${dirty ? " unsaved-indicator-visible" : ""}`}>Unsaved changes</span></label><button className="primary-button">Save tariff</button>{dirty && <button type="button" className="secondary-button" onClick={cancel}>Cancel</button>}</form></div>}
  </div>;
}

function DateFormatForm({ dateFormat }: { dateFormat: string }) {
  return <form className="inline-form" action={updateUserSettings}><label>Date format<select name="dateFormat" defaultValue={dateFormat}><option value="DD_MM_YYYY">DD/MM/YYYY</option><option value="MM_DD_YYYY">MM/DD/YYYY</option><option value="YYYY_MM_DD">YYYY-MM-DD</option></select></label><button className="primary-button">Save format</button></form>;
}

function PaymentForm({ meetings, payers, invoices, dateFormat }: { meetings: Meeting[]; payers: { id: string; fullName: string }[]; invoices: { id: string; amount: string; meetingId: string }[]; dateFormat: string }) {
  return <form className="inline-form" action={createPayment}><select name="meetingId" required><option value="">Meeting</option>{meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.subjectClient.fullName} · {dateLabel(meeting.startsAt, dateFormat)}</option>)}</select><select name="invoiceId"><option value="">No invoice</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{money(invoice.amount)}</option>)}</select><select name="payerId"><option value="">Payer</option>{payers.map((payer) => <option key={payer.id} value={payer.id}>{payer.fullName}</option>)}</select><input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required /><input name="paidAt" type="date" required /><button className="primary-button">Add payment</button></form>;
}

function MeetingTable({ meetings, onDelete, dateFormat, onClientClick }: { meetings: Meeting[]; onDelete: (formData: FormData) => Promise<void>; dateFormat: string; onClientClick?: (clientId: string) => void }) {
  return <table><thead><tr><th>Date</th><th>Clients</th><th>Type</th><th>Status</th><th>Tariff</th><th /></tr></thead><tbody>{meetings.map((meeting) => <tr key={meeting.id}><td>{dateLabel(meeting.startsAt, dateFormat)}</td><td>{(meeting.participants?.length ? meeting.participants : [meeting.subjectClient]).map((client) => onClientClick ? <button className="client-link meeting-client client-link-button" type="button" onClick={() => onClientClick(client.id)} key={client.id}>{client.fullName}</button> : <a className="client-link meeting-client" href={`#client-${client.id}`} key={client.id}>{client.fullName}</a>)}</td><td>{statusLabel(meeting.type)}</td><td><span className="status-pill">{statusLabel(meeting.workflowStatus)}</span></td><td>{money(meeting.tariff)}</td><td className="row-actions"><details><summary>Edit</summary><form action={updateMeeting} className="edit-form"><input type="hidden" name="id" value={meeting.id} /><input name="startsAt" defaultValue={new Date(meeting.startsAt).toISOString().slice(0, 16)} type="datetime-local" required /><input name="tariff" defaultValue={meeting.tariff} type="number" min="0" step="0.01" required /><select name="workflowStatus" defaultValue={meeting.workflowStatus}><option value="REGISTERED">Registered</option><option value="REMINDER_SENT">Reminder sent</option><option value="PAID_INVOICE_PENDING">Paid - invoice pending</option><option value="PAID_INVOICE_ISSUED">Paid and invoice issued</option></select><button className="primary-button">Save</button></form></details>{onDelete && <form action={onDelete}><input type="hidden" name="id" value={meeting.id} /><button className="danger">Delete</button></form>}</td></tr>)}</tbody></table>;
}
