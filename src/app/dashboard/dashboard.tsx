"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient, createMeeting, createPayment, deleteClient, deleteMeeting, deletePayment, updateClient, updateMeeting, updatePayment } from "./actions";

type Client = { id: string; fullName: string; clientType: string; email: string | null; familyAccountId: string };
type Meeting = {
  id: string; startsAt: Date | string; type: string; workflowStatus: string; tariff: string;
  subjectClient: Client; invoices: { id: string; amount: string; status: string }[];
};
type Payment = {
  id: string; amount: string; paidAt: string; meeting: { id: string; startsAt: string; subjectClient: Client };
  payer: { fullName: string } | null; payerNameSnapshot: string | null;
};

const dateLabel = (value: Date | string) => new Date(value).toLocaleDateString();
const money = (value: string) => `$${Number(value).toFixed(2)}`;
const statusLabel = (value?: string) => (value || "registered").replaceAll("_", " ").toLowerCase();

export default function Dashboard({
  clinicName, clients, families, meetings, payments, invoices, payers,
}: {
  clinicName: string; clients: Client[]; families: { id: string; accountName: string }[];
  meetings: Meeting[]; payments: Payment[]; invoices: { id: string; amount: string; meetingId: string }[];
  payers: { id: string; fullName: string }[];
}) {
  const [tab, setTab] = useState("overview");
  const [clientFilter, setClientFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const due = useMemo(() => meetings.map((meeting) => {
    const billed = meeting.invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const paid = payments.filter((payment) => payment.meeting.id === meeting.id)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { meeting, due: Math.max(0, billed - paid) };
  }).filter((row) => row.due > 0), [meetings, payments]);
  const filteredClients = clients.filter((client) => client.fullName.toLowerCase().includes(clientFilter.toLowerCase()));
  const filteredPayments = payments.filter((payment) => payment.meeting.subjectClient.fullName.toLowerCase().includes(paymentFilter.toLowerCase()));
  const filteredDue = due.filter((row) => row.meeting.subjectClient.fullName.toLowerCase().includes(dueFilter.toLowerCase()));

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div><p className="kicker">Manager workspace</p><h1>{clinicName}</h1></div>
        <Link href="/" className="dashboard-home">Home</Link>
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
          <article className="dashboard-card"><p className="kicker">Clients</p><strong>{clients.length}</strong><span>Across {families.length} family accounts</span></article>
          <article className="dashboard-card"><p className="kicker">Payments</p><strong>{payments.length}</strong><span>Recorded locally</span></article>
          <section className="dashboard-card dashboard-card-wide"><div className="section-heading"><h2>Recent meetings</h2><button onClick={() => setTab("meetings")}>View all</button></div><MeetingTable meetings={meetings.slice(0, 8)} onDelete={deleteMeeting} /></section>
        </section>
      )}

      {tab === "clients" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Directory</p><h2>Clients</h2></div><input placeholder="Filter by name" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} /></div><ClientForm families={families} /><table><thead><tr><th>Name</th><th>Type</th><th>Email</th><th /></tr></thead><tbody>{filteredClients.map((client) => <tr key={client.id}><td>{client.fullName}</td><td>{statusLabel(client.clientType)}</td><td>{client.email || "—"}</td><td className="row-actions"><details><summary>Edit</summary><form action={updateClient} className="edit-form"><input type="hidden" name="id" value={client.id} /><input name="fullName" defaultValue={client.fullName} required /><input name="email" defaultValue={client.email || ""} type="email" /><button className="primary-button">Save</button></form></details><form action={deleteClient}><input type="hidden" name="id" value={client.id} /><button className="danger">Delete</button></form></td></tr>)}</tbody></table></section>}
      {tab === "meetings" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Calendar</p><h2>Meetings</h2></div></div><MeetingForm clients={clients} families={families} /><MeetingTable meetings={meetings} onDelete={deleteMeeting} /></section>}
      {tab === "payments" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Cash flow</p><h2>Payments</h2></div><input placeholder="Filter by client" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} /></div><PaymentForm meetings={meetings} payers={payers} invoices={invoices} /><table><thead><tr><th>Date</th><th>Client</th><th>Payer</th><th>Amount</th><th /></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.id}><td>{dateLabel(payment.paidAt)}</td><td>{payment.meeting.subjectClient.fullName}</td><td>{payment.payer?.fullName || payment.payerNameSnapshot || "Unidentified"}</td><td>{money(payment.amount)}</td><td className="row-actions"><details><summary>Edit</summary><form action={updatePayment} className="edit-form"><input type="hidden" name="id" value={payment.id} /><input name="amount" defaultValue={payment.amount} type="number" min="0" step="0.01" required /><input name="paidAt" defaultValue={payment.paidAt.slice(0, 10)} type="date" required /><input name="payerName" defaultValue={payment.payerNameSnapshot || payment.payer?.fullName || ""} /><button className="primary-button">Save</button></form></details><form action={deletePayment}><input type="hidden" name="id" value={payment.id} /><button className="danger">Delete</button></form></td></tr>)}</tbody></table></section>}
      {tab === "due" && <section className="dashboard-card"><div className="section-heading"><div><p className="kicker">Collections</p><h2>Due payments</h2></div><input placeholder="Filter by client" value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} /></div><table><thead><tr><th>Date</th><th>Client</th><th>Status</th><th>Due</th></tr></thead><tbody>{filteredDue.map((row) => <tr key={row.meeting.id}><td>{dateLabel(row.meeting.startsAt)}</td><td>{row.meeting.subjectClient.fullName}</td><td>{statusLabel(row.meeting.workflowStatus)}</td><td>{money(row.due.toString())}</td></tr>)}</tbody></table></section>}
    </main>
  );
}

function ClientForm({ families }: { families: { id: string; accountName: string }[] }) {
  return <form className="inline-form" action={createClient}><input name="fullName" required placeholder="Full name" /><select name="familyAccountId" required><option value="">Family account</option>{families.map((family) => <option key={family.id} value={family.id}>{family.accountName}</option>)}</select><select name="clientType" defaultValue="CHILD"><option value="CHILD">Child</option><option value="PARENT">Parent</option><option value="BOTH_PARENTS">Both parents</option></select><input name="email" type="email" placeholder="Email" /><button className="primary-button">Add client</button></form>;
}

function MeetingForm({ clients, families }: { clients: Client[]; families: { id: string; accountName: string }[] }) {
  return <form className="inline-form" action={createMeeting}><select name="familyAccountId" required><option value="">Family account</option>{families.map((family) => <option key={family.id} value={family.id}>{family.accountName}</option>)}</select><select name="subjectClientId" required><option value="">Client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select><select name="type" defaultValue="CHILD"><option value="CHILD">Child</option><option value="PARENT_A">Parent A</option><option value="PARENT_B">Parent B</option><option value="BOTH_PARENTS">Both parents</option></select><input name="startsAt" type="datetime-local" required /><input name="tariff" type="number" min="0" step="0.01" placeholder="Tariff" required /><button className="primary-button">Add meeting</button></form>;
}

function PaymentForm({ meetings, payers, invoices }: { meetings: Meeting[]; payers: { id: string; fullName: string }[]; invoices: { id: string; amount: string; meetingId: string }[] }) {
  return <form className="inline-form" action={createPayment}><select name="meetingId" required><option value="">Meeting</option>{meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.subjectClient.fullName} · {dateLabel(meeting.startsAt)}</option>)}</select><select name="invoiceId"><option value="">No invoice</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{money(invoice.amount)}</option>)}</select><select name="payerId"><option value="">Payer</option>{payers.map((payer) => <option key={payer.id} value={payer.id}>{payer.fullName}</option>)}</select><input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required /><input name="paidAt" type="date" required /><button className="primary-button">Add payment</button></form>;
}

function MeetingTable({ meetings, onDelete }: { meetings: Meeting[]; onDelete: (formData: FormData) => Promise<void> }) {
  return <table><thead><tr><th>Date</th><th>Client</th><th>Type</th><th>Status</th><th>Tariff</th><th /></tr></thead><tbody>{meetings.map((meeting) => <tr key={meeting.id}><td>{dateLabel(meeting.startsAt)}</td><td>{meeting.subjectClient.fullName}</td><td>{statusLabel(meeting.type)}</td><td><span className="status-pill">{statusLabel(meeting.workflowStatus)}</span></td><td>{money(meeting.tariff)}</td><td className="row-actions"><details><summary>Edit</summary><form action={updateMeeting} className="edit-form"><input type="hidden" name="id" value={meeting.id} /><input name="startsAt" defaultValue={new Date(meeting.startsAt).toISOString().slice(0, 16)} type="datetime-local" required /><input name="tariff" defaultValue={meeting.tariff} type="number" min="0" step="0.01" required /><select name="workflowStatus" defaultValue={meeting.workflowStatus}><option value="REGISTERED">Registered</option><option value="REMINDER_SENT">Reminder sent</option><option value="PAID_INVOICE_PENDING">Paid - invoice pending</option><option value="PAID_INVOICE_ISSUED">Paid and invoice issued</option></select><button className="primary-button">Save</button></form></details>{onDelete && <form action={onDelete}><input type="hidden" name="id" value={meeting.id} /><button className="danger">Delete</button></form>}</td></tr>)}</tbody></table>;
}
