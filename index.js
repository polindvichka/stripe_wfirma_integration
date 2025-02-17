import 'dotenv/config';

import { allPayments, addWfirmaIdsToMetadata } from "./stripe.js";
import patients from "./db.js";
import { addContractor, findContractor, addInvoice } from './wfirma.js';


async function createInvoices() {
    for (const payment of allPayments) {
        if (!payment.metadata.wfirmaInvoiceId) {
            let wfirmaContractorId = await findContractor(payment.metadata.email);

            if (!wfirmaContractorId) {
                const patient = patients.find(p => p.email === payment.metadata.email);
                if (!patient) continue;
                wfirmaContractorId = await addContractor(patient.first_name, patient.last_name, patient.street_name, patient.house_number, patient.postal_code, patient.city, patient.email, patient.unit_id);
            }
            if (!wfirmaContractorId) continue;
            let wfirmaInvoiceId = await addInvoice(payment.created, wfirmaContractorId);
            await addWfirmaIdsToMetadata(payment.id, wfirmaInvoiceId, wfirmaContractorId);
        }
    }
};

// createInvoices();
